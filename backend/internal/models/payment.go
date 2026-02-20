package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentStatus string

const (
	PaymentPending   PaymentStatus = "pending"
	PaymentSuccess   PaymentStatus = "success"
	PaymentFailed    PaymentStatus = "failed"
	PaymentRefunded  PaymentStatus = "refunded"
)

type Payment struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	SessionID      uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"session_id"`
	PaymentMethod  string         `gorm:"size:50" json:"payment_method"`
	PaymentGateway string         `gorm:"size:50;default:'dummy'" json:"payment_gateway"`
	ExternalID     string         `gorm:"size:200" json:"external_id"`
	Amount         float64        `gorm:"type:decimal(12,2);not null" json:"amount"`
	Status         PaymentStatus  `gorm:"size:20;default:'pending'" json:"status"`
	CallbackData   string         `gorm:"type:text" json:"callback_data,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	Session ChargingSession `gorm:"foreignKey:SessionID" json:"session,omitempty"`
}

func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
