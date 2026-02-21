package handlers

import (
	"log"
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
	log.Printf("DEBUG: List stations triggered, found %d active stations", len(stations))
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
func (h *StationHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID stasiun tidak valid"})
		return
	}

	// Gunakan transaksi untuk memastikan stasiun dan semua data terkait terhapus bersamaan
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Ambil ID konektor yang terkait dengan stasiun ini
		var connectorIDs []uuid.UUID
		if err := tx.Model(&models.Connector{}).Where("station_id = ?", id).Pluck("id", &connectorIDs).Error; err != nil {
			return err
		}

		if len(connectorIDs) > 0 {
			// 2. Ambil ID sesi yang terkait dengan konektor-konektor ini
			var sessionIDs []uuid.UUID
			if err := tx.Model(&models.ChargingSession{}).Where("connector_id IN ?", connectorIDs).Pluck("id", &sessionIDs).Error; err != nil {
				return err
			}

			if len(sessionIDs) > 0 {
				// 3. Hapus pembayaran terkait sesi
				if err := tx.Where("session_id IN ?", sessionIDs).Delete(&models.Payment{}).Error; err != nil {
					return err
				}
				// 4. Hapus sesi
				if err := tx.Where("id IN ?", sessionIDs).Delete(&models.ChargingSession{}).Error; err != nil {
					return err
				}
			}

			// 5. Hapus konektor
			if err := tx.Where("id IN ?", connectorIDs).Delete(&models.Connector{}).Error; err != nil {
				return err
			}
		}

		// 6. Hapus stasiun itu sendiri
		if err := tx.Delete(&models.Station{}, "id = ?", id).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus stasiun: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stasiun dan semua data terkait berhasil dihapus"})
}
func (h *StationHandler) Create(c *gin.Context) {
	log.Println("DEBUG: Create station request received")
	var input struct {
		Name       string  `json:"name" binding:"required"`
		Address    string  `json:"address" binding:"required"`
		Latitude   float64 `json:"latitude"`
		Longitude  float64 `json:"longitude"`
		QRCode     string  `json:"qr_code" binding:"required"`
		Connectors []struct {
			ConnectorType string  `json:"connector_type" binding:"required"`
			PowerKW       float64 `json:"power_kw" binding:"required"`
			PricePerKWH   float64 `json:"price_per_kwh" binding:"required"`
		} `json:"connectors" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid: " + err.Error()})
		return
	}

	station := models.Station{
		Name:      input.Name,
		Address:   input.Address,
		Latitude:  input.Latitude,
		Longitude: input.Longitude,
		QRCode:    input.QRCode,
		Status:    models.StationActive,
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&station).Error; err != nil {
			return err
		}

		for _, connInput := range input.Connectors {
			connector := models.Connector{
				StationID:     station.ID,
				ConnectorType: connInput.ConnectorType,
				PowerKW:       connInput.PowerKW,
				PricePerKWH:   connInput.PricePerKWH,
				Status:        models.ConnectorAvailable,
				MQTTTopic:     "charger/" + station.ID.String() + "/connector",
			}
			if err := tx.Create(&connector).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		log.Printf("DEBUG: Failed to save station: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan stasiun: " + err.Error()})
		return
	}

	log.Printf("DEBUG: Station created successfully: %s (ID: %s)", station.Name, station.ID)
	c.JSON(http.StatusCreated, station)
}
func (h *StationHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID stasiun tidak valid"})
		return
	}

	var input struct {
		Name       string  `json:"name" binding:"required"`
		Address    string  `json:"address" binding:"required"`
		Latitude   float64 `json:"latitude"`
		Longitude  float64 `json:"longitude"`
		QRCode     string  `json:"qr_code" binding:"required"`
		Status     string  `json:"status"`
		Connectors []struct {
			ID            uuid.UUID `json:"id"`
			ConnectorType string    `json:"connector_type" binding:"required"`
			PowerKW       float64   `json:"power_kw" binding:"required"`
			PricePerKWH   float64   `json:"price_per_kwh" binding:"required"`
		} `json:"connectors" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid: " + err.Error()})
		return
	}

	err = h.DB.Transaction(func(tx *gorm.DB) error {
		var station models.Station
		if err := tx.First(&station, "id = ?", id).Error; err != nil {
			return err
		}

		station.Name = input.Name
		station.Address = input.Address
		station.Latitude = input.Latitude
		station.Longitude = input.Longitude
		station.QRCode = input.QRCode
		if input.Status != "" {
			station.Status = models.StationStatus(input.Status)
		}

		if err := tx.Save(&station).Error; err != nil {
			return err
		}

		// Handle connectors
		// 1. Get current connector IDs
		var existingConnectorIDs []uuid.UUID
		if err := tx.Model(&models.Connector{}).Where("station_id = ?", id).Pluck("id", &existingConnectorIDs).Error; err != nil {
			return err
		}

		// 2. Track which connectors to keep/update
		inputConnectorIDs := make(map[uuid.UUID]bool)
		for _, connInput := range input.Connectors {
			if connInput.ID != uuid.Nil {
				inputConnectorIDs[connInput.ID] = true
				// Update existing connector
				connector := models.Connector{
					ID:            connInput.ID,
					StationID:     id,
					ConnectorType: connInput.ConnectorType,
					PowerKW:       connInput.PowerKW,
					PricePerKWH:   connInput.PricePerKWH,
				}
				if err := tx.Model(&connector).Updates(map[string]interface{}{
					"connector_type": connInput.ConnectorType,
					"power_kw":       connInput.PowerKW,
					"price_per_kwh":  connInput.PricePerKWH,
				}).Error; err != nil {
					return err
				}
			} else {
				// Create new connector
				newConnector := models.Connector{
					StationID:     id,
					ConnectorType: connInput.ConnectorType,
					PowerKW:       connInput.PowerKW,
					PricePerKWH:   connInput.PricePerKWH,
					Status:        models.ConnectorAvailable,
					MQTTTopic:     "charger/" + station.ID.String() + "/connector",
				}
				if err := tx.Create(&newConnector).Error; err != nil {
					return err
				}
			}
		}

		// 3. Delete connectors that are not in the input
		for _, existingID := range existingConnectorIDs {
			if !inputConnectorIDs[existingID] {
				// Note: In a real system, we should check if there are active sessions
				// For now, we trust the admin UI.
				if err := tx.Delete(&models.Connector{}, "id = ?", existingID).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui stasiun: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stasiun berhasil diperbarui"})
}
