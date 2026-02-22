package database

import (
	"log"

	"github.com/Julianarwansah/sistemcharging/backend/internal/config"
	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
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
	DB.AutoMigrate(
		&models.User{},
		&models.Station{},
		&models.Connector{},
		&models.ChargingSession{},
		&models.Payment{},
		&models.WalletTransaction{},
	)
	// Manual migration for GoogleID to handle NULL values in unique index
	DB.Exec("ALTER TABLE users ALTER COLUMN google_id DROP NOT NULL")
	DB.Exec("ALTER TABLE users ALTER COLUMN google_id SET DEFAULT NULL")
	DB.Exec("UPDATE users SET google_id = NULL WHERE google_id = ''")

	log.Println("✅ Database migrated successfully")
}

func Seed() {
	// 1. Seed Stations & Connectors
	var stationCount int64
	DB.Model(&models.Station{}).Count(&stationCount)
	if stationCount == 0 {
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
		log.Println("✅ Station seed data created successfully")
	} else {
		log.Println("ℹ️  Station seed data already exists, skipping station seed...")
	}

	// 2. Seed Admin Users
	log.Println("🔄 Ensuring super admin users...")
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

	adminEmails := []string{"admin@charging.id", "julianarwansahhh@gmail.com"}

	for _, email := range adminEmails {
		var existingAdmin models.User
		if err := DB.Unscoped().Where("email = ?", email).First(&existingAdmin).Error; err == nil {
			log.Printf("✅ Found existing admin account (%s), updating...", email)
			DB.Unscoped().Model(&existingAdmin).Updates(map[string]interface{}{
				"name":          "Super Admin",
				"password_hash": string(hashedPassword),
				"role":          "super_admin",
				"deleted_at":    nil,
			})
		} else {
			adminUser := models.User{
				Name:         "Super Admin",
				Email:        email,
				Phone:        "081234567890",
				PasswordHash: string(hashedPassword),
				Role:         "super_admin",
			}
			if err := DB.Create(&adminUser).Error; err != nil {
				log.Printf("⚠️  Failed to create admin user (%s): %v", email, err)
			} else {
				log.Printf("✅ Default super admin created successfully (%s)", email)
			}
		}
	}
}
