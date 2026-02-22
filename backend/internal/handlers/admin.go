package handlers

import (
	"net/http"
	"time"

	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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

	logActivity(c, h.DB, "Reset Transaksi", "Semua Tabel", "Admin mereset seluruh data transaksi dan saldo pengguna")
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
	logActivity(c, h.DB, "Hapus Pengguna", target.Email, "Admin menghapus pengguna: "+target.Name)
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

func (h *AdminHandler) GetRevenueStats(c *gin.Context) {
	type RevenuePoint struct {
		Date  string  `json:"date"`
		Total float64 `json:"total"`
	}

	var stats []RevenuePoint

	// Query for PostgreSQL to group by date and sum amount
	query := `
		SELECT 
			TO_CHAR(date_series, 'DD Mon') as date,
			COALESCE(SUM(p.amount), 0) as total
		FROM 
			generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') AS date_series
		LEFT JOIN 
			payments p ON DATE(p.created_at) = date_series AND p.status = 'success'
		GROUP BY 
			date_series
		ORDER BY 
			date_series ASC;
	`

	if err := h.DB.Raw(query).Scan(&stats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data statistik: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *AdminHandler) GetNotifications(c *gin.Context) {
	type Activity struct {
		Type    string    `json:"type"`
		Title   string    `json:"title"`
		Message string    `json:"message"`
		Time    time.Time `json:"time"`
		Status  string    `json:"status"`
		RefID   string    `json:"ref_id"`
	}

	var activities []Activity

	// 1. Recent Users
	var recentUsers []models.User
	h.DB.Order("created_at desc").Limit(5).Find(&recentUsers)
	for _, u := range recentUsers {
		activities = append(activities, Activity{
			Type:    "user",
			Title:   "Pengguna Baru",
			Message: u.Name + " telah mendaftar",
			Time:    u.CreatedAt,
			Status:  "info",
			RefID:   u.ID.String(),
		})
	}

	// 2. Recent Payments
	var recentPayments []models.Payment
	h.DB.Preload("Session.User").Where("status = ?", models.PaymentSuccess).Order("created_at desc").Limit(5).Find(&recentPayments)
	for _, p := range recentPayments {
		userName := "Unknown"
		if p.Session.User.Name != "" {
			userName = p.Session.User.Name
		}
		activities = append(activities, Activity{
			Type:    "payment",
			Title:   "Pembayaran Berhasil",
			Message: "Top up / Pembayaran dari " + userName,
			Time:    p.CreatedAt,
			Status:  "success",
			RefID:   p.ID.String(),
		})
	}

	// 3. Recent Sessions
	var recentSessions []models.ChargingSession
	h.DB.Preload("User").Order("created_at desc").Limit(5).Find(&recentSessions)
	for _, s := range recentSessions {
		activities = append(activities, Activity{
			Type:    "session",
			Title:   "Sesi Charging",
			Message: "Sesi #" + s.ID.String()[:8] + " status " + string(s.Status),
			Time:    s.CreatedAt,
			Status:  "warning",
			RefID:   s.ID.String(),
		})
	}

	// Sort by time descending
	// (Using simple slice sort because it's a small number of items)
	for i := 0; i < len(activities); i++ {
		for j := i + 1; j < len(activities); j++ {
			if activities[i].Time.Before(activities[j].Time) {
				activities[i], activities[j] = activities[j], activities[i]
			}
		}
	}

	// Limit to total 10 most recent
	if len(activities) > 10 {
		activities = activities[:10]
	}

	c.JSON(http.StatusOK, activities)
}

func (h *AdminHandler) GetSettings(c *gin.Context) {
	var configs []models.SystemConfig
	if err := h.DB.Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil pengaturan: " + err.Error()})
		return
	}

	settings := make(map[string]string)
	for _, cfg := range configs {
		settings[cfg.ConfigKey] = cfg.ConfigValue
	}

	c.JSON(http.StatusOK, settings)
}

func (h *AdminHandler) UpdateSettings(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid"})
		return
	}

	for key, value := range req {
		if err := h.DB.Model(&models.SystemConfig{}).Where("config_key = ?", key).Update("config_value", value).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui pengaturan " + key})
			return
		}
	}

	logActivity(c, h.DB, "Update Pengaturan", "Sistem", "Admin memperbarui pengaturan global")
	c.JSON(http.StatusOK, gin.H{"message": "Pengaturan berhasil diperbarui"})
}

func (h *AdminHandler) GetActiveStations(c *gin.Context) {
	type StationMetric struct {
		ID               string  `json:"id"`
		Name             string  `json:"name"`
		TransactionCount int     `json:"transaction_count"`
		TotalRevenue     float64 `json:"total_revenue"`
	}

	var metrics []StationMetric

	query := `
		SELECT 
			s.id, 
			s.name, 
			COUNT(p.id) as transaction_count, 
			COALESCE(SUM(p.amount), 0) as total_revenue
		FROM 
			stations s
		LEFT JOIN 
			connectors c ON c.station_id = s.id
		LEFT JOIN 
			charging_sessions cs ON cs.connector_id = c.id
		LEFT JOIN 
			payments p ON p.session_id = cs.id AND p.status = 'success'
		GROUP BY 
			s.id, s.name
		ORDER BY 
			total_revenue DESC, transaction_count DESC
		LIMIT 5
	`

	if err := h.DB.Raw(query).Scan(&metrics).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data performa stasiun"})
		return
	}

	c.JSON(http.StatusOK, metrics)
}

func (h *AdminHandler) ChangePassword(c *gin.Context) {
	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
		return
	}

	adminID, _ := c.Get("user_id")
	var admin models.User
	if err := h.DB.First(&admin, "id = ?", adminID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admin tidak ditemukan"})
		return
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kata sandi saat ini salah"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi kata sandi"})
		return
	}

	if err := h.DB.Model(&admin).Update("password_hash", string(hashedPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui kata sandi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kata sandi berhasil diubah"})
}

func (h *AdminHandler) BlockUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID user tidak valid"})
		return
	}

	if err := h.DB.Model(&models.User{}).Where("id = ?", id).Update("status", "blocked").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memblokir user"})
		return
	}

	logActivity(c, h.DB, "Blokir Pengguna", id.String(), "Admin memblokir akses pengguna")
	c.JSON(http.StatusOK, gin.H{"message": "User berhasil diblokir"})
}

func (h *AdminHandler) UnblockUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID user tidak valid"})
		return
	}

	if err := h.DB.Model(&models.User{}).Where("id = ?", id).Update("status", "active").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengaktifkan user kembali"})
		return
	}

	logActivity(c, h.DB, "Aktifkan Pengguna", id.String(), "Admin mengaktifkan kembali akses pengguna")
	c.JSON(http.StatusOK, gin.H{"message": "User berhasil diaktifkan kembali"})
}

func (h *AdminHandler) GetUserTransactions(c *gin.Context) {
	userID := c.Param("id")
	var transactions []models.Payment
	if err := h.DB.Preload("User").Preload("Session.Connector.Station").
		Joins("JOIN charging_sessions ON charging_sessions.id = payments.session_id").
		Where("charging_sessions.user_id = ?", userID).
		Order("payments.created_at desc").
		Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil riwayat transaksi pengguna: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, transactions)
}

func (h *AdminHandler) GetActivityLogs(c *gin.Context) {
	var logs []models.ActivityLog
	if err := h.DB.Order("created_at desc").Limit(20).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil log aktivitas: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}
