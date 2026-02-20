package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ConnectorStatus string

const (
	ConnectorAvailable ConnectorStatus = "available"
	ConnectorInUse     ConnectorStatus = "in_use"
	ConnectorFault     ConnectorStatus = "fault"
	ConnectorOffline   ConnectorStatus = "offline"
)

type Connector struct {
	ID             uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	StationID      uuid.UUID       `gorm:"type:uuid;not null;index" json:"station_id"`
	ConnectorType  string          `gorm:"size:50;not null" json:"connector_type"`  // Type2, CCS, CHAdeMO, etc.
	PowerKW        float64         `gorm:"type:decimal(6,2);not null" json:"power_kw"`
	PricePerKWH    float64         `gorm:"type:decimal(10,2);not null" json:"price_per_kwh"`
	Status         ConnectorStatus `gorm:"size:20;default:'available'" json:"status"`
	MQTTTopic      string          `gorm:"size:200;not null" json:"mqtt_topic"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	DeletedAt      gorm.DeletedAt  `gorm:"index" json:"-"`

	Station  Station           `gorm:"foreignKey:StationID" json:"station,omitempty"`
	Sessions []ChargingSession `gorm:"foreignKey:ConnectorID" json:"sessions,omitempty"`
}

func (c *Connector) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
