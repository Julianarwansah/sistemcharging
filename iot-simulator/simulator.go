package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"os"
	"os/signal"
	"syscall"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type ChargerCommand struct {
	Action    string  `json:"action"`
	SessionID string  `json:"session_id"`
	TargetKWH float64 `json:"target_kwh"`
}

type ChargerStatus struct {
	Status    string  `json:"status"`
	EnergyKWH float64 `json:"energy_kwh"`
	PowerKW   float64 `json:"power_kw"`
	Progress  int     `json:"progress"`
	SessionID string  `json:"session_id"`
}

type ChargerSimulator struct {
	client    mqtt.Client
	chargerID string
	charging  bool
	sessionID string
	energyKWH float64
	powerKW   float64
	targetKWH float64
}

func main() {
	brokerURL := getEnv("MQTT_BROKER", "tcp://localhost:1883")
	chargerID := getEnv("CHARGER_ID", "simulator-001")

	sim := &ChargerSimulator{
		chargerID: chargerID,
		powerKW:   3.3, // Default 3.3 kW
		targetKWH: 5.0, // Default target 5 kWh
	}

	opts := mqtt.NewClientOptions().
		AddBroker(brokerURL).
		SetClientID("charger-" + chargerID).
		SetAutoReconnect(true)

	opts.SetOnConnectHandler(func(c mqtt.Client) {
		log.Printf("✅ Charger simulator [%s] connected to MQTT broker", chargerID)
		sim.subscribe()
	})

	client := mqtt.NewClient(opts)
	sim.client = client

	token := client.Connect()
	token.Wait()
	if token.Error() != nil {
		log.Fatalf("Failed to connect to MQTT broker: %v", token.Error())
	}

	// Publish initial idle status
	sim.publishStatus("idle", 0, 0)

	log.Println("⚡ Charger simulator running. Waiting for commands...")
	log.Println("   Press Ctrl+C to stop")

	// Wait for interrupt
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down simulator...")
	client.Disconnect(250)
}

func (s *ChargerSimulator) subscribe() {
	// Subscribe to ALL command topics (wildcard)
	topic := "charger/+/+/command"
	s.client.Subscribe(topic, 1, func(c mqtt.Client, msg mqtt.Message) {
		var cmd ChargerCommand
		if err := json.Unmarshal(msg.Payload(), &cmd); err != nil {
			log.Printf("Error parsing command: %v", err)
			return
		}

		log.Printf("📥 Received command: %s (session: %s)", cmd.Action, cmd.SessionID)

		switch cmd.Action {
		case "START":
			s.startCharging(cmd.SessionID, cmd.TargetKWH)
		case "STOP":
			s.stopCharging()
		}
	})

	log.Printf("📡 Subscribed to: %s", topic)
}

func (s *ChargerSimulator) startCharging(sessionID string, targetKWH float64) {
	if s.charging {
		log.Println("⚠️  Already charging!")
		return
	}

	s.charging = true
	s.sessionID = sessionID
	s.energyKWH = 0
	s.targetKWH = targetKWH
	if s.targetKWH <= 0 {
		s.targetKWH = 5.0 // Fallback
	}

	log.Printf("⚡ Starting charging session: %s (Target: %.2f kWh)", sessionID, targetKWH)

	// Derive the status topic from command topic
	// e.g., "charger/{stationID}/connector1/command" → "charger/{stationID}/connector1/status"
	// But we publish to the wildcard pattern the API subscribes to
	go func() {
		ticker := time.NewTicker(3 * time.Second) // Update every 3 seconds
		defer ticker.Stop()

		for range ticker.C {
			if !s.charging {
				return
			}

			// Simulate energy consumption (accelerated for demo)
			increment := s.powerKW * (3.0 / 3600.0) // 3 seconds worth of energy
			// Add some randomness
			increment *= (0.9 + rand.Float64()*0.2)
			s.energyKWH += increment
			s.energyKWH = math.Round(s.energyKWH*1000) / 1000

			progress := int(math.Min((s.energyKWH/s.targetKWH)*100, 100))

			if progress >= 100 {
				s.energyKWH = s.targetKWH
				s.publishStatusWithSession("complete", 100)
				s.charging = false
				log.Printf("✅ Charging complete! Total: %.3f kWh", s.energyKWH)
				return
			}

			s.publishStatusWithSession("charging", progress)
			log.Printf("⚡ Charging... %.3f kWh (%d%%)", s.energyKWH, progress)
		}
	}()
}

func (s *ChargerSimulator) stopCharging() {
	if !s.charging {
		log.Println("⚠️  Not currently charging")
		return
	}

	s.charging = false
	s.publishStatusWithSession("complete", 100)
	log.Printf("🛑 Charging stopped. Total: %.3f kWh", s.energyKWH)
}

func (s *ChargerSimulator) publishStatus(status string, progress int, energyKWH float64) {
	payload := ChargerStatus{
		Status:    status,
		EnergyKWH: energyKWH,
		PowerKW:   s.powerKW,
		Progress:  progress,
		SessionID: s.sessionID,
	}

	data, _ := json.Marshal(payload)
	topic := fmt.Sprintf("charger/%s/status", s.chargerID)
	s.client.Publish(topic, 1, false, data)
}

func (s *ChargerSimulator) publishStatusWithSession(status string, progress int) {
	payload := ChargerStatus{
		Status:    status,
		EnergyKWH: s.energyKWH,
		PowerKW:   s.powerKW,
		Progress:  progress,
		SessionID: s.sessionID,
	}

	data, _ := json.Marshal(payload)
	// Publish to the wildcard-subscribable topic
	topic := fmt.Sprintf("charger/%s/status", s.chargerID)
	s.client.Publish(topic, 1, false, data)
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
