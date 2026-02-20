package database

import (
	"log"

	"github.com/Julianarwansah/sistemcharging/backend/internal/config"
	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) *gorm.DB {
	var err error
	DB, err = gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("✅ Database connected successfully")
	return DB
}

func Migrate() {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Station{},
		&models.Connector{},
		&models.ChargingSession{},
		&models.Payment{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	log.Println("✅ Database migrated successfully")
}

func Seed() {
	var count int64
	DB.Model(&models.Station{}).Count(&count)
	if count > 0 {
		log.Println("ℹ️  Seed data already exists, skipping...")
		return
	}

	station1 := models.Station{
		Name:      "Stasiun Charging Sudirman",
		Address:   "Jl. Jenderal Sudirman No. 1, Jakarta",
		Latitude:  -6.2088,
		Longitude: 106.8456,
		QRCode:    "STN-SUDIRMAN-001",
		Status:    models.StationActive,
	}
	DB.Create(&station1)

	station2 := models.Station{
		Name:      "Stasiun Charging Thamrin",
		Address:   "Jl. MH Thamrin No. 10, Jakarta",
		Latitude:  -6.1944,
		Longitude: 106.8229,
		QRCode:    "STN-THAMRIN-001",
		Status:    models.StationActive,
	}
	DB.Create(&station2)

	connectors := []models.Connector{
		{
			StationID:     station1.ID,
			ConnectorType: "Type 2",
			PowerKW:       3.3,
			PricePerKWH:   2500,
			Status:        models.ConnectorAvailable,
			MQTTTopic:     "charger/" + station1.ID.String() + "/connector1",
		},
		{
			StationID:     station1.ID,
			ConnectorType: "CCS",
			PowerKW:       50.0,
			PricePerKWH:   3500,
			Status:        models.ConnectorAvailable,
			MQTTTopic:     "charger/" + station1.ID.String() + "/connector2",
		},
		{
			StationID:     station2.ID,
			ConnectorType: "Type 2",
			PowerKW:       7.4,
			PricePerKWH:   2800,
			Status:        models.ConnectorAvailable,
			MQTTTopic:     "charger/" + station2.ID.String() + "/connector1",
		},
	}

	for _, c := range connectors {
		DB.Create(&c)
	}

	log.Println("✅ Seed data created successfully")
}
