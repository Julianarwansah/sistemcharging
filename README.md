---
title: SistemCharging Backend
emoji: ⚡
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# SistemCharging ⚡

Sistem charging motor listrik berbasis scan QR → aplikasi mobile → pembayaran → kontrol IoT charger.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Flutter App  │────▶│  Golang API  │────▶│  PostgreSQL   │
│ (Mobile)     │◀────│  (Gin+GORM)  │◀────│  Database     │
└──────┬───────┘     └──────┬───────┘     └──────────────┘
       │                    │
       │ WebSocket          │ MQTT
       │                    ▼
       │             ┌──────────────┐     ┌──────────────┐
       └────────────▶│  Mosquitto   │◀───▶│  IoT Charger │
                     │  MQTT Broker │     │  (Device)    │
                     └──────────────┘     └──────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Mobile App | Flutter (Dart) |
| Backend API | Go (Gin, GORM) |
| Database | PostgreSQL 16 |
| IoT Messaging | MQTT (Mosquitto) |
| Auth | JWT |
| Payment | Dummy (extensible to Midtrans/Xendit) |
| Infrastructure | Docker Compose |

## User Flow

1. **Scan QR** → User scan QR code di stasiun charging
2. **Lihat Info** → App tampilkan detail stasiun, connector, & harga
3. **Bayar** → User pilih durasi/kWh, lakukan pembayaran
4. **Charging** → Sistem kirim command START ke charger via MQTT
5. **Monitor** → Real-time progress via WebSocket
6. **Selesai** → Charger berhenti, sesi dicatat

## Database & Admin Connections
*   PostgreSQL: `localhost:5433` (User: `charging_user`, Pass: `charging_pass_2026`)
*   Mosquitto: `localhost:1883` (MQTT) / `9001` (WebSocket)
*   **Admin Dashboard Account**:
    *   Email: `julianarwansahhh@gmail.com`
    *   Password: `admin123`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| POST | `/api/v1/auth/register` | ✗ | Register user baru |
| POST | `/api/v1/auth/login` | ✗ | Login, return JWT |
| GET | `/api/v1/auth/profile` | ✓ | Get user profile |
| GET | `/api/v1/stations` | ✓ | List semua stasiun |
| GET | `/api/v1/stations/:id` | ✓ | Detail stasiun |
| GET | `/api/v1/stations/qr/:code` | ✓ | Lookup by QR code |
| POST | `/api/v1/sessions` | ✓ | Mulai sesi charging |
| GET | `/api/v1/sessions/:id` | ✓ | Detail sesi |
| POST | `/api/v1/sessions/:id/stop` | ✓ | Stop charging |
| GET | `/api/v1/sessions/history` | ✓ | Riwayat charging |
| POST | `/api/v1/payments/callback` | ✗ | Payment callback |
| WS | `/api/v1/ws/session/:id` | ✓ | Real-time updates |

## MQTT Protocol

| Topic | Direction | Payload |
|-------|-----------|---------|
| `charger/{id}/command` | API → Charger | `{"action":"START\|STOP","session_id":"..."}` |
| `charger/{id}/status` | Charger → API | `{"status":"idle\|charging\|complete","energy_kwh":2.5,"power_kw":3.3,"progress":65}` |

## Database Schema

```
users           stations          connectors
├── id (UUID)   ├── id (UUID)     ├── id (UUID)
├── name        ├── name          ├── station_id (FK)
├── email       ├── address       ├── connector_type
├── phone       ├── latitude      ├── power_kw
├── password    ├── longitude     ├── price_per_kwh
└── timestamps  ├── qr_code       ├── status
                └── status        └── mqtt_topic

charging_sessions              payments
├── id (UUID)                  ├── id (UUID)
├── user_id (FK)               ├── session_id (FK)
├── connector_id (FK)          ├── payment_method
├── status                     ├── amount
├── energy_kwh                 ├── status
├── total_cost                 └── timestamps
├── started_at
├── ended_at
└── timestamps
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Go 1.21+
- Flutter 3.x

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Run Backend API
```bash
cd backend
cp .env.example .env
go mod tidy
go run cmd/server/main.go
```

### 3. Run IoT Simulator
```bash
cd iot-simulator
go run simulator.go
```

### 4. Run Flutter App
```bash
cd mobile
flutter pub get
flutter run
```

## Project Structure

```
sistemcharging/
├── backend/                 # Golang API
│   ├── cmd/server/          # Entry point
│   ├── internal/
│   │   ├── config/          # Configuration
│   │   ├── database/        # DB connection & migrations
│   │   ├── models/          # GORM models
│   │   ├── handlers/        # HTTP handlers
│   │   ├── middleware/       # JWT auth middleware
│   │   ├── mqtt/            # MQTT client
│   │   └── services/        # Business logic
│   └── .env.example
├── mobile/                  # Flutter App
│   ├── lib/
│   │   ├── models/          # Data models
│   │   ├── providers/       # State management
│   │   ├── screens/         # UI screens
│   │   ├── services/        # API & WebSocket
│   │   └── widgets/         # Reusable widgets
│   └── pubspec.yaml
├── iot-simulator/           # Charger simulator
├── docker-compose.yml
└── README.md
```

## License

 Julian Arwansah- © 2026
