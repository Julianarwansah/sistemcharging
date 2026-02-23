# ============================================================
# SistemCharging IoT Simulator - Hugging Face Spaces Dockerfile
# ============================================================

# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

# Copy go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY simulator.go .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /simulator .

# ============================================================
# Run stage
# ============================================================
FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /simulator /app/simulator

# Hugging Face Spaces requires port 7860
EXPOSE 7860

# Default environment variables
ENV SERVER_PORT=7860
ENV CHARGER_ID=simulator-001
ENV MQTT_BROKER=tcp://localhost:1883
ENV MQTT_USER=""
ENV MQTT_PASS=""

CMD ["/app/simulator"]
