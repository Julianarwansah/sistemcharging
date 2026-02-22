package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SystemConfig struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	ConfigKey   string         `gorm:"size:100;uniqueIndex;not null" json:"config_key"`
	ConfigValue string         `gorm:"type:text;not null" json:"config_value"`
	Description string         `gorm:"size:255" json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (c *SystemConfig) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}
