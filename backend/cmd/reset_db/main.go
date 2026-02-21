package main

import (
	"log"

	"github.com/Julianarwansah/sistemcharging/backend/internal/config"
	"github.com/Julianarwansah/sistemcharging/backend/internal/database"
	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg)

	log.Println("Resetting all transaction data...")

	db.Exec("TRUNCATE TABLE charging_sessions CASCADE")
	db.Exec("TRUNCATE TABLE payments CASCADE")
	db.Exec("TRUNCATE TABLE wallet_transactions CASCADE")

	db.Model(&models.User{}).Where("1 = 1").Update("balance", 0)
	db.Model(&models.Connector{}).Where("1 = 1").Update("status", "available")

	log.Println("✅ Data reset successful!")
}
