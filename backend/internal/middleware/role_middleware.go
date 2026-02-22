package middleware

import (
	"net/http"

	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func RoleMiddleware(db *gorm.DB, allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDObj, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		userID := userIDObj.(uuid.UUID)
		var user models.User
		if err := db.First(&user, "id = ?", userID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		// Check if user is blocked
		if user.Status == "blocked" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akun Anda telah diblokir. Silakan hubungi admin."})
			c.Abort()
			return
		}

		isAllowed := false
		for _, role := range allowedRoles {
			if user.Role == role {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak. Anda tidak memiliki izin untuk melakukan tindakan ini."})
			c.Abort()
			return
		}

		c.Set("user_role", user.Role)
		c.Next()
	}
}
