# ============================================================
# SistemCharging Backend - Hugging Face Spaces Dockerfile
# ============================================================

# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Copy go module files
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy backend source code
COPY backend/ .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# ============================================================
# Run stage
# ============================================================
FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /server /app/server

# Hugging Face Spaces requires port 7860
EXPOSE 7860

# Default port to 7860 for Hugging Face
ENV SERVER_PORT=7860

CMD ["/app/server"]
