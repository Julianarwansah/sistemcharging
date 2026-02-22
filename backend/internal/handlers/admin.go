package handlers

import (
	"net/http"

	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminHandler struct {
	DB *gorm.DB
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	var totalRevenue float64
	var totalUsers int64
	var activeStations int64
	var totalEnergy float64

	// Total Revenue from successful payments
	h.DB.Model(&models.Payment{}).Where("status = ?", models.PaymentSuccess).Select("COALESCE(SUM(amount), 0)").Scan(&totalRevenue)

	// Total Users
	h.DB.Model(&models.User{}).Count(&totalUsers)

	// Active Stations
	h.DB.Model(&models.Station{}).Where("status = ?", models.StationActive).Count(&activeStations)

	// Total Energy from completed sessions
	h.DB.Model(&models.ChargingSession{}).Where("status = ?", models.SessionCompleted).Select("COALESCE(SUM(energy_kwh), 0)").Scan(&totalEnergy)

	c.JSON(http.StatusOK, gin.H{
		"total_revenue":   totalRevenue,
		"total_users":     totalUsers,
		"active_stations": activeStations,
		"total_energy":    totalEnergy,
	})
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	var users []models.User
	if err := h.DB.Order("created_at desc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pengguna"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *AdminHandler) ListCustomers(c *gin.Context) {
	var users []models.User
	if err := h.DB.Where("role = ?", "user").Order("created_at desc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pelanggan"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *AdminHandler) ListAdmins(c *gin.Context) {
	var users []models.User
	if err := h.DB.Where("role IN ?", []string{"admin", "super_admin"}).Order("created_at desc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data administrator"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (h *AdminHandler) ListTransactions(c *gin.Context) {
	var sessions []models.ChargingSession
	if err := h.DB.Preload("User").Preload("Connector.Station").Order("created_at desc").Find(&sessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data transaksi"})
		return
	}
	c.JSON(http.StatusOK, sessions)
}

func (h *AdminHandler) ResetData(c *gin.Context) {
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// Truncate transaction tables
		// Note: Using Raw SQL for TRUNCATE as GORM doesn't have a direct truncate method
		if err := tx.Exec("TRUNCATE TABLE charging_sessions CASCADE").Error; err != nil {
			return err
		}
		if err := tx.Exec("TRUNCATE TABLE payments CASCADE").Error; err != nil {
			return err
		}
		if err := tx.Exec("TRUNCATE TABLE wallet_transactions CASCADE").Error; err != nil {
			return err
		}

		// Reset all user balances
		if err := tx.Model(&models.User{}).Where("1 = 1").Update("balance", 0).Error; err != nil {
			return err
		}

		// Reset all connectors to available
		if err := tx.Model(&models.Connector{}).Where("1 = 1").Update("status", "available").Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mereset data: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Seluruh data transaksi telah direset dan saldo dikembalikan ke 0"})
}
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	targetID := c.Param("id")
	requestorIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Fetch requester info
	var requestor models.User
	if err := h.DB.First(&requestor, "id = ?", requestorIDRaw).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Fetch target info
	var target models.User
	if err := h.DB.Unscoped().First(&target, "id = ?", targetID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	}

	// Enforce rules
	// 1. Prevent self-deletion
	if target.ID.String() == requestor.ID.String() {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda tidak dapat menghapus akun Anda sendiri"})
		return
	}

	// 2. Only Super Admin can delete other Super Admins
	if target.Role == "super_admin" && requestor.Role != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya Super Admin yang dapat menghapus Super Admin lainnya"})
		return
	}

	if err := h.DB.Delete(&target).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus pengguna: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Pengguna berhasil dihapus"})
}

func (h *AdminHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
		Role  string `json:"role"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.DB.First(&user, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}

	if len(updates) > 0 {
		if err := h.DB.Model(&user).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui pengguna: " + err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, user)
}
