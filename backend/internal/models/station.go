package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StationStatus string

const (
	StationActive      StationStatus = "active"
	StationMaintenance StationStatus = "maintenance"
	StationOffline     StationStatus = "offline"
)

type Station struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string         `gorm:"size:200;not null" json:"name"`
	Address   string         `gorm:"size:500;not null" json:"address"`
	Latitude  float64        `gorm:"type:decimal(10,7)" json:"latitude"`
	Longitude float64        `gorm:"type:decimal(10,7)" json:"longitude"`
	QRCode    string         `gorm:"size:100;uniqueIndex;not null" json:"qr_code"`
	Status    StationStatus  `gorm:"size:20;default:'active'" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Connectors []Connector `gorm:"foreignKey:StationID" json:"connectors,omitempty"`
}

func (s *Station) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
