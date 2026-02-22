package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ActivityLog struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	AdminID   uuid.UUID `gorm:"type:uuid;index;not null" json:"admin_id"`
	AdminName string    `gorm:"size:100;not null" json:"admin_name"`
	Action    string    `gorm:"size:100;index;not null" json:"action"` // Block User, Reset Data, etc.
	Target    string    `gorm:"size:255" json:"target"`                // User ID, Station ID, or Name
	Detail    string    `gorm:"type:text" json:"detail"`               // Full description or JSON payload
	IPAddress string    `gorm:"size:45" json:"ip_address"`             // IPv6 compatible size
	CreatedAt time.Time `json:"created_at"`

	Admin User `gorm:"foreignKey:AdminID" json:"-"`
}

func (a *ActivityLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
