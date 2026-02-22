package handlers

import (
	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func logActivity(c *gin.Context, db *gorm.DB, action, target, detail string) {
	adminIDRaw, exists := c.Get("user_id")
	if !exists {
		return
	}

	adminID := adminIDRaw.(uuid.UUID)
	var admin models.User
	if err := db.First(&admin, "id = ?", adminID).Error; err != nil {
		return
	}

	activity := models.ActivityLog{
		AdminID:   adminID,
		AdminName: admin.Name,
		Action:    action,
		Target:    target,
		Detail:    detail,
		IPAddress: c.ClientIP(),
	}

	db.Create(&activity)
}
