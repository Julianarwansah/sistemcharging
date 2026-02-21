package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransactionType string

const (
	TransactionTopUp     TransactionType = "topup"
	TransactionDeduction TransactionType = "deduction"
	TransactionRefund    TransactionType = "refund"
)

type WalletTransaction struct {
	ID              uuid.UUID       `gorm:"type:uuid;primaryKey" json:"id"`
	UserID          uuid.UUID       `gorm:"type:uuid;not null;index" json:"user_id"`
	Amount          float64         `gorm:"type:decimal(15,2);not null" json:"amount"`
	TransactionType TransactionType `gorm:"size:20;not null" json:"transaction_type"`
	ReferenceID     string          `gorm:"size:100" json:"reference_id"` // Session ID or Payment ID
	Description     string          `gorm:"size:255" json:"description"`
	CreatedAt       time.Time       `json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (wt *WalletTransaction) BeforeCreate(tx *gorm.DB) error {
	if wt.ID == uuid.Nil {
		wt.ID = uuid.New()
	}
	return nil
}
