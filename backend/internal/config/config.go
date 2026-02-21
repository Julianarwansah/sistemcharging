package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort     string
	DBHost         string
	DBPort         string
	DBUser         string
	DBPassword     string
	DBName         string
	DBSSLMode      string
	JWTSecret      string
	JWTExpiryHrs   int
	MQTTBroker     string
	MQTTClientID   string
	GoogleClientID string
}

func Load() *Config {
	godotenv.Load()

	expiryHrs, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "72"))

	return &Config{
		ServerPort:     getEnv("SERVER_PORT", "8080"),
		DBHost:         getEnv("DB_HOST", "localhost"),
		DBPort:         getEnv("DB_PORT", "5432"),
		DBUser:         getEnv("DB_USER", "charging_user"),
		DBPassword:     getEnv("DB_PASSWORD", "charging_pass_2026"),
		DBName:         getEnv("DB_NAME", "sistemcharging"),
		DBSSLMode:      getEnv("DB_SSLMODE", "disable"),
		JWTSecret:      getEnv("JWT_SECRET", "default-secret-change-me"),
		JWTExpiryHrs:   expiryHrs,
		MQTTBroker:     getEnv("MQTT_BROKER", "tcp://localhost:1883"),
		MQTTClientID:   getEnv("MQTT_CLIENT_ID", "charging-api-server"),
		GoogleClientID: getEnv("GOOGLE_CLIENT_ID", ""),
	}
}

func (c *Config) DSN() string {
	return "postgres://" + c.DBUser + ":" + c.DBPassword + "@" + c.DBHost + ":" + c.DBPort + "/" + c.DBName + "?sslmode=" + c.DBSSLMode + "&TimeZone=Asia/Jakarta"
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
