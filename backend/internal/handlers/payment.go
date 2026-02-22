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

type PaymentHandler struct {
	DB   *gorm.DB
	MQTT *mqttclient.MQTTClient
	Hub  *mqttclient.WebSocketHub
}

// DummyPay simulates a payment completion (for development)
func (h *PaymentHandler) DummyPay(c *gin.Context) {
	paymentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payment ID tidak valid"})
		return
	}

	var payment models.Payment
	if err := h.DB.First(&payment, "id = ?", paymentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pembayaran tidak ditemukan"})
		return
	}

	if payment.Status != models.PaymentPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pembayaran sudah diproses"})
		return
	}

	// Mark payment as success
	payment.Status = models.PaymentSuccess
	h.DB.Save(&payment)

	// Update session to paid
	var session models.ChargingSession
	h.DB.Preload("Connector").First(&session, "id = ?", payment.SessionID)
	session.Status = models.SessionPaid
	now := time.Now()
	session.StartedAt = &now
	h.DB.Save(&session)

	// Mark connector as in use
	session.Connector.Status = models.ConnectorInUse
	h.DB.Save(&session.Connector)

	// Send START command via MQTT
	err = h.MQTT.SendCommand(session.Connector.MQTTTopic, mqttclient.ChargerCommand{
		Action:    "START",
		SessionID: session.ID.String(),
		TargetKWH: session.TargetKWH,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Pembayaran berhasil tapi gagal mengirim perintah ke charger",
			"payment": payment,
		})
		return
	}

	// Update session to charging
	session.Status = models.SessionCharging
	h.DB.Save(&session)

	// Broadcast session update
	wsData, _ := json.Marshal(map[string]interface{}{
		"session_id": session.ID,
		"status":     session.Status,
		"user_id":    session.UserID,
	})
	h.Hub.Broadcast(session.ID.String(), wsData)
	h.Hub.Broadcast(session.UserID.String(), wsData)
	h.Hub.Broadcast("admin", wsData)

	c.JSON(http.StatusOK, gin.H{
		"message": "Pembayaran berhasil! Charging dimulai.",
		"payment": payment,
		"session": session,
	})
}

// Callback handles payment gateway callbacks (for future Midtrans/Xendit integration)
func (h *PaymentHandler) Callback(c *gin.Context) {
	// This endpoint will be implemented when integrating real payment gateways
	// For now, use the /pay/:id endpoint for dummy payments
	c.JSON(http.StatusOK, gin.H{"message": "Payment callback received"})
}
