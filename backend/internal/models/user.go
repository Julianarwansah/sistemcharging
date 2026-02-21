package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Name         string         `gorm:"size:100;not null" json:"name"`
	Email        string         `gorm:"size:100;uniqueIndex;not null" json:"email"`
	Phone        string         `gorm:"size:20" json:"phone"`
	PasswordHash string         `gorm:"size:255" json:"-"`
	GoogleID     string         `gorm:"size:255;uniqueIndex" json:"-"`
	IsOnline     bool           `gorm:"default:false" json:"is_online"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Sessions []ChargingSession `gorm:"foreignKey:UserID" json:"sessions,omitempty"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
