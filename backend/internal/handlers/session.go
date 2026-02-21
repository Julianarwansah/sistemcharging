package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
	mqttclient "github.com/Julianarwansah/sistemcharging/backend/internal/mqtt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SessionHandler struct {
	DB   *gorm.DB
	MQTT *mqttclient.MQTTClient
	Hub  *mqttclient.WebSocketHub
}

type CreateSessionRequest struct {
	ConnectorID string  `json:"connector_id" binding:"required"`
	TargetKWH   float64 `json:"target_kwh" binding:"required,gt=0"`
}

func (h *SessionHandler) Create(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	connectorID, err := uuid.Parse(req.ConnectorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Connector ID tidak valid"})
		return
	}

	// Check connector availability
	var connector models.Connector
	if err := h.DB.First(&connector, "id = ?", connectorID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Connector tidak ditemukan"})
		return
	}

	if connector.Status != models.ConnectorAvailable {
		c.JSON(http.StatusConflict, gin.H{"error": "Connector sedang tidak tersedia"})
		return
	}

	// Check user balance
	var user models.User
	if err := h.DB.First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	// Calculate estimated cost
	estimatedCost := req.TargetKWH * connector.PricePerKWH

	if user.Balance < estimatedCost {
		c.JSON(http.StatusPaymentRequired, gin.H{
			"error":   "Saldo tidak mencukupi",
			"balance": user.Balance,
			"needed":  estimatedCost,
		})
		return
	}

	// Check user doesn't have active session
	var activeCount int64
	h.DB.Model(&models.ChargingSession{}).
		Where("user_id = ? AND status IN ?", userID, []string{"pending", "paid", "charging"}).
		Count(&activeCount)
	if activeCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Anda masih memiliki sesi charging aktif"})
		return
	}

	// Create session
	session := models.ChargingSession{
		UserID:      userID,
		ConnectorID: connectorID,
		Status:      models.SessionPending,
		TargetKWH:   req.TargetKWH,
		TotalCost:   estimatedCost,
	}

	if err := h.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sesi charging"})
		return
	}

	// Create dummy payment
	payment := models.Payment{
		SessionID:      session.ID,
		PaymentMethod:  "dummy",
		PaymentGateway: "dummy",
		ExternalID:     "DUMMY-" + session.ID.String()[:8],
		Amount:         estimatedCost,
		Status:         models.PaymentPending,
	}

	if err := h.DB.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pembayaran"})
		return
	}

	// Load relations
	h.DB.Preload("Connector").Preload("Payment").First(&session, "id = ?", session.ID)

	c.JSON(http.StatusCreated, gin.H{
		"session":        session,
		"estimated_cost": estimatedCost,
		"payment_url":    "/api/v1/payments/pay/" + payment.ID.String(),
		"message":        "Sesi dibuat. Silakan lakukan pembayaran.",
	})
}

func (h *SessionHandler) Get(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID tidak valid"})
		return
	}

	var session models.ChargingSession
	if err := h.DB.Preload("Connector.Station").Preload("Payment").
		First(&session, "id = ? AND user_id = ?", sessionID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sesi tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, session)
}

func (h *SessionHandler) Stop(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID tidak valid"})
		return
	}

	var session models.ChargingSession
	if err := h.DB.Preload("Connector").
		First(&session, "id = ? AND user_id = ?", sessionID, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Sesi tidak ditemukan"})
		return
	}

	if session.Status != models.SessionCharging {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sesi tidak sedang dalam proses charging"})
		return
	}

	// Send STOP command via MQTT
	err = h.MQTT.SendCommand(session.Connector.MQTTTopic, mqttclient.ChargerCommand{
		Action:    "STOP",
		SessionID: session.ID.String(),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengirim perintah stop"})
		return
	}

	// Update session and balance in transaction
	err = h.DB.Transaction(func(tx *gorm.DB) error {
		now := time.Now()
		session.Status = models.SessionCompleted
		session.EndedAt = &now
		session.TotalCost = session.EnergyKWH * session.Connector.PricePerKWH

		if err := tx.Save(&session).Error; err != nil {
			return err
		}

		// Deduct balance
		if err := tx.Model(&models.User{}).Where("id = ?", userID).Update("balance", gorm.Expr("balance - ?", session.TotalCost)).Error; err != nil {
			return err
		}

		// Create transaction record
		transaction := models.WalletTransaction{
			UserID:          userID,
			Amount:          session.TotalCost,
			TransactionType: models.TransactionDeduction,
			ReferenceID:     session.ID.String(),
			Description:     "Pembayaran pengisian daya",
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		// Free connector
		session.Connector.Status = models.ConnectorAvailable
		if err := tx.Save(&session.Connector).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyelesaikan sesi dan memotong saldo"})
		return
	}

	// Broadcast balance update
	var user models.User
	h.DB.Select("balance").First(&user, "id = ?", userID)
	balanceData, _ := json.Marshal(map[string]interface{}{
		"type":    "balance_update",
		"balance": user.Balance,
		"user_id": userID,
	})
	h.Hub.Broadcast(userID.String(), balanceData)
	h.Hub.Broadcast("admin", balanceData)

	c.JSON(http.StatusOK, gin.H{
		"message":    "Charging berhasil dihentikan",
		"session":    session,
		"total_cost": session.TotalCost,
	})
}

func (h *SessionHandler) History(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var sessions []models.ChargingSession
	if err := h.DB.Preload("Connector.Station").Preload("Payment").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&sessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil riwayat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"total":    len(sessions),
	})
}
