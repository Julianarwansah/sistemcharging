package handlers

import (
	"net/http"

	"github.com/Julianarwansah/sistemcharging/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WalletHandler struct {
	DB *gorm.DB
}

func (h *WalletHandler) GetBalance(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var user models.User
	if err := h.DB.Select("balance").First(&user, "id = ?", userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"balance": user.Balance})
}

// TopUp (Mock for development)
func (h *WalletHandler) TopUp(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var input struct {
		Amount float64 `json:"amount" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid"})
		return
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Update user balance
		if err := tx.Model(&models.User{}).Where("id = ?", userID).Update("balance", gorm.Expr("balance + ?", input.Amount)).Error; err != nil {
			return err
		}

		// 2. Create transaction record
		transaction := models.WalletTransaction{
			UserID:          userID,
			Amount:          input.Amount,
			TransactionType: models.TransactionTopUp,
			Description:     "Top up saldo",
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal melakukan top up"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Top up berhasil"})
}

// AdminTopUp (For testing in admin panel)
func (h *WalletHandler) AdminTopUp(c *gin.Context) {
	var input struct {
		UserID string  `json:"user_id" binding:"required"`
		Amount float64 `json:"amount" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Input tidak valid"})
		return
	}

	targetUserID, err := uuid.Parse(input.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID tidak valid"})
		return
	}

	err = h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.User{}).Where("id = ?", targetUserID).Update("balance", gorm.Expr("balance + ?", input.Amount)).Error; err != nil {
			return err
		}

		transaction := models.WalletTransaction{
			UserID:          targetUserID,
			Amount:          input.Amount,
			TransactionType: models.TransactionTopUp,
			Description:     "Top up saldo oleh Admin",
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal melakukan top up oleh admin"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Top up oleh admin berhasil"})
}
