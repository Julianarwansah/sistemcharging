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
