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
