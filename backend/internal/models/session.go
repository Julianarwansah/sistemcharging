package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SessionStatus string

const (
	SessionPending    SessionStatus = "pending"
	SessionPaid       SessionStatus = "paid"
	SessionCharging   SessionStatus = "charging"
	SessionCompleted  SessionStatus = "completed"
	SessionCancelled  SessionStatus = "cancelled"
	SessionFailed     SessionStatus = "failed"
)

type ChargingSession struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	UserID       uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	ConnectorID  uuid.UUID      `gorm:"type:uuid;not null;index" json:"connector_id"`
	Status       SessionStatus  `gorm:"size:20;default:'pending'" json:"status"`
	EnergyKWH    float64        `gorm:"type:decimal(10,3);default:0" json:"energy_kwh"`
	PowerKW      float64        `gorm:"type:decimal(6,2);default:0" json:"power_kw"`
	Progress     int            `gorm:"default:0" json:"progress"`
	TotalCost    float64        `gorm:"type:decimal(12,2);default:0" json:"total_cost"`
	TargetKWH    float64        `gorm:"type:decimal(10,3);default:0" json:"target_kwh"`
	StartedAt    *time.Time     `json:"started_at"`
	EndedAt      *time.Time     `json:"ended_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Connector Connector `gorm:"foreignKey:ConnectorID" json:"connector,omitempty"`
	Payment   *Payment  `gorm:"foreignKey:SessionID" json:"payment,omitempty"`
}

func (s *ChargingSession) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
