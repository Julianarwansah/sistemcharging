package main

import (
	"log"

	"github.com/Julianarwansah/sistemcharging/backend/internal/config"
	"github.com/Julianarwansah/sistemcharging/backend/internal/database"
	"github.com/Julianarwansah/sistemcharging/backend/internal/handlers"
	"github.com/Julianarwansah/sistemcharging/backend/internal/middleware"
	mqttclient "github.com/Julianarwansah/sistemcharging/backend/internal/mqtt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	db := database.Connect(cfg)
	database.Migrate()
	database.Seed()

	// Initialize WebSocket hub
	wsHub := mqttclient.NewWebSocketHub()

	// Initialize MQTT client
	mqttClient := mqttclient.NewMQTTClient(cfg, db, wsHub)

	// Setup Gin router
	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "SistemCharging API",
			"version": "1.0.0",
		})
	})

	// Initialize handlers
	authHandler := &handlers.AuthHandler{
		DB:             db,
		JWTSecret:      cfg.JWTSecret,
		JWTExpiry:      cfg.JWTExpiryHrs,
		GoogleClientID: cfg.GoogleClientID,
	}
	stationHandler := &handlers.StationHandler{DB: db}
	sessionHandler := &handlers.SessionHandler{DB: db, MQTT: mqttClient}
	paymentHandler := &handlers.PaymentHandler{DB: db, MQTT: mqttClient}
	adminHandler := &handlers.AdminHandler{DB: db}
	wsHandler := &handlers.WebSocketHandler{Hub: wsHub}

	// API routes
	api := r.Group("/api/v1")
	{
		// Public routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/google", authHandler.GoogleLogin)
		}

		// Payment callback (public)
		api.POST("/payments/callback", paymentHandler.Callback)
		api.POST("/payments/pay/:id", paymentHandler.DummyPay)

		// Protected routes
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			// Profile
			protected.GET("/auth/profile", authHandler.Profile)
			protected.POST("/auth/logout", authHandler.Logout)

			// Admin routes
			admin := protected.Group("/admin")
			{
				admin.GET("/stats", adminHandler.GetStats)
				admin.GET("/users", adminHandler.ListUsers)
				admin.GET("/transactions", adminHandler.ListTransactions)
			}

			// Stations
			protected.GET("/stations", stationHandler.List)
			protected.GET("/stations/:id", stationHandler.Get)
			protected.GET("/stations/qr/:code", stationHandler.GetByQR)

			// Sessions
			protected.POST("/sessions", sessionHandler.Create)
			protected.GET("/sessions/:id", sessionHandler.Get)
			protected.POST("/sessions/:id/stop", sessionHandler.Stop)
			protected.GET("/sessions/history", sessionHandler.History)

			// WebSocket
			protected.GET("/ws/session/:id", wsHandler.HandleSession)
		}
	}

	// Start server
	addr := ":" + cfg.ServerPort
	log.Printf("🚀 SistemCharging API starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
