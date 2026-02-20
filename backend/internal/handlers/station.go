package handlers

import (
	"net/http"

	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StationHandler struct {
	DB *gorm.DB
}

func (h *StationHandler) List(c *gin.Context) {
	var stations []models.Station
	if err := h.DB.Preload("Connectors").Where("status = ?", models.StationActive).Find(&stations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data stasiun"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stations": stations,
		"total":    len(stations),
	})
}

func (h *StationHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID stasiun tidak valid"})
		return
	}

	var station models.Station
	if err := h.DB.Preload("Connectors").First(&station, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stasiun tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, station)
}

func (h *StationHandler) GetByQR(c *gin.Context) {
	qrCode := c.Param("code")
	if qrCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "QR code tidak boleh kosong"})
		return
	}

	var station models.Station
	if err := h.DB.Preload("Connectors").Where("qr_code = ?", qrCode).First(&station).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stasiun dengan QR code tersebut tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, station)
}
