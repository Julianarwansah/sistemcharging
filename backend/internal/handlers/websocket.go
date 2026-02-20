package handlers

import (
	"log"
	"net/http"

	mqttclient "github.com/Julianarwansah/sistemcharging/backend/internal/mqtt"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WebSocketHandler struct {
	Hub *mqttclient.WebSocketHub
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins in development
	},
}

func (h *WebSocketHandler) HandleSession(c *gin.Context) {
	sessionID := c.Param("id")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Session ID required"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	// Subscribe to session updates
	ch := h.Hub.Subscribe(sessionID)
	defer h.Hub.Unsubscribe(sessionID, ch)

	log.Printf("🔌 WebSocket client connected for session: %s", sessionID)

	// Send initial connection message
	conn.WriteJSON(map[string]string{
		"type":    "connected",
		"message": "Terhubung ke sesi charging " + sessionID,
	})

	// Read from channel and write to WebSocket
	for data := range ch {
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("WebSocket write error: %v", err)
			break
		}
	}
}
