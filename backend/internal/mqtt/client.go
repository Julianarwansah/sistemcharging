package mqttclient

import (
	"encoding/json"
	"log"
	"time"

	"github.com/Julianarwansah/sistemcharging/backend/internal/config"
	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MQTTClient struct {
	client mqtt.Client
	db     *gorm.DB
	hub    *WebSocketHub
}

type ChargerStatus struct {
	Status    string  `json:"status"`
	EnergyKWH float64 `json:"energy_kwh"`
	PowerKW   float64 `json:"power_kw"`
	Progress  int     `json:"progress"`
	SessionID string  `json:"session_id"`
}

type ChargerCommand struct {
	Action    string  `json:"action"`
	SessionID string  `json:"session_id"`
	TargetKWH float64 `json:"target_kwh"`
}

type WebSocketHub struct {
	Topics map[string][]chan []byte
}

func NewWebSocketHub() *WebSocketHub {
	return &WebSocketHub{
		Topics: make(map[string][]chan []byte),
	}
}

func (h *WebSocketHub) Subscribe(topic string) chan []byte {
	ch := make(chan []byte, 10)
	h.Topics[topic] = append(h.Topics[topic], ch)
	return ch
}

func (h *WebSocketHub) Unsubscribe(topic string, ch chan []byte) {
	channels := h.Topics[topic]
	for i, c := range channels {
		if c == ch {
			h.Topics[topic] = append(channels[:i], channels[i+1:]...)
			close(ch)
			break
		}
	}
}

func (h *WebSocketHub) Broadcast(topic string, data []byte) {
	for _, ch := range h.Topics[topic] {
		select {
		case ch <- data:
		default:
		}
	}
}

func NewMQTTClient(cfg *config.Config, db *gorm.DB, hub *WebSocketHub) *MQTTClient {
	opts := mqtt.NewClientOptions().
		AddBroker(cfg.MQTTBroker).
		SetClientID(cfg.MQTTClientID).
		SetAutoReconnect(true).
		SetConnectRetry(true).
		SetConnectRetryInterval(5 * time.Second)

	mc := &MQTTClient{
		db:  db,
		hub: hub,
	}

	opts.SetOnConnectHandler(func(c mqtt.Client) {
		log.Println("✅ MQTT connected")
		mc.subscribeToChargerStatus()
	})

	opts.SetConnectionLostHandler(func(c mqtt.Client, err error) {
		log.Printf("⚠️  MQTT connection lost: %v", err)
	})

	client := mqtt.NewClient(opts)
	mc.client = client

	token := client.Connect()
	token.Wait()
	if token.Error() != nil {
		log.Printf("⚠️  MQTT connection failed (will retry): %v", token.Error())
	}

	return mc
}

func (mc *MQTTClient) subscribeToChargerStatus() {
	topic := "charger/+/status"
	mc.client.Subscribe(topic, 1, func(c mqtt.Client, msg mqtt.Message) {
		var status ChargerStatus
		if err := json.Unmarshal(msg.Payload(), &status); err != nil {
			log.Printf("Error parsing charger status: %v", err)
			return
		}

		log.Printf("📡 Charger status received: %s - %s (%.2f kWh, %d%%)",
			status.SessionID, status.Status, status.EnergyKWH, status.Progress)

		if status.SessionID == "" {
			return
		}

		sessionID, err := uuid.Parse(status.SessionID)
		if err != nil {
			return
		}

		var session models.ChargingSession
		if err := mc.db.First(&session, "id = ?", sessionID).Error; err != nil {
			return
		}

		session.EnergyKWH = status.EnergyKWH
		session.PowerKW = status.PowerKW
		session.Progress = status.Progress

		// Fetch connector to get price if needed for real-time cost
		var connector models.Connector
		mc.db.First(&connector, "id = ?", session.ConnectorID)
		session.TotalCost = status.EnergyKWH * connector.PricePerKWH

		switch status.Status {
		case "charging":
			session.Status = models.SessionCharging
		case "complete":
			session.Status = models.SessionCompleted
			now := time.Now()
			session.EndedAt = &now

			var connector models.Connector
			mc.db.First(&connector, "id = ?", session.ConnectorID)
			session.TotalCost = status.EnergyKWH * connector.PricePerKWH
			session.Progress = 100

			connector.Status = models.ConnectorAvailable
			mc.db.Save(&connector)
		case "error":
			session.Status = models.SessionFailed
			now := time.Now()
			session.EndedAt = &now

			var connector models.Connector
			mc.db.First(&connector, "id = ?", session.ConnectorID)
			connector.Status = models.ConnectorFault
			mc.db.Save(&connector)
		}

		mc.db.Save(&session)

		// Broadcast to WebSocket subscribers
		wsData, _ := json.Marshal(map[string]interface{}{
			"session_id": session.ID,
			"status":     session.Status,
			"energy_kwh": session.EnergyKWH,
			"power_kw":   session.PowerKW,
			"progress":   session.Progress,
			"total_cost": session.TotalCost,
		})
		mc.hub.Broadcast(session.ID.String(), wsData)
		mc.hub.Broadcast("admin", wsData)
	})

	log.Println("📡 Subscribed to charger/+/status")
}

func (mc *MQTTClient) SendCommand(connectorMQTTTopic string, command ChargerCommand) error {
	payload, err := json.Marshal(command)
	if err != nil {
		return err
	}

	topic := connectorMQTTTopic + "/command"
	token := mc.client.Publish(topic, 1, false, payload)
	token.Wait()
	return token.Error()
}

func (mc *MQTTClient) GetHub() *WebSocketHub {
	return mc.hub
}
