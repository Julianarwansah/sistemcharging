# Panduan Deploy ke Hugging Face Spaces (Gratis) ⚡

## Overview

| Komponen | Platform | Status |
|----------|----------|--------|
| Backend (Go API) | Hugging Face Spaces | 🆕 Baru |
| Admin Panel (React) | Hugging Face Spaces | 🆕 Baru |
| Database (PostgreSQL) | Neon (free) | Perlu Setup |
| MQTT Broker | HiveMQ Cloud (free) | Opsional |

---

## Langkah 1: Setup Database PostgreSQL Gratis (Neon)

1. Buka https://neon.tech dan daftar akun gratis
2. Buat project baru → pilih region **Asia Pacific (Singapore)**
3. Catat **Connection String** format:
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```
4. Simpan nilai-nilai ini untuk langkah berikutnya:
   - `DB_HOST` = host dari connection string
   - `DB_USER` = username
   - `DB_PASSWORD` = password
   - `DB_NAME` = nama database

---

## Langkah 2: Setup MQTT Broker Gratis (HiveMQ Cloud) - Opsional

1. Buka https://www.hivemq.com/mqtt-cloud-broker/ dan daftar gratis
2. Buat cluster baru
3. Catat:
   - `MQTT_BROKER` = `tcp://your-cluster.s1.eu.hivemq.cloud:1883`
   - `MQTT_USER` = username
   - `MQTT_PASS` = password

> **Catatan**: Jika tidak butuh MQTT (tidak ada charger fisik), bisa skip bagian ini.

---

## Langkah 3: Deploy Backend ke Hugging Face

### 3a. Buat Hugging Face Space (Backend)

1. Login ke https://huggingface.co
2. Klik **"New Space"**
3. Isi form:
   - **Space name**: `sistemcharging-backend`
   - **SDK**: Docker
   - **Visibility**: Public
4. Klik **Create Space**

### 3b. Push Code ke Space (Backend)

```bash
# Clone Space yang baru dibuat
git clone https://huggingface.co/spaces/YOUR_USERNAME/sistemcharging-backend

# Masuk ke folder
cd sistemcharging-backend

# Copy file yang diperlukan dari repo utama
cp -r /path/to/sistemcharging/backend ./backend
cp /path/to/sistemcharging/Dockerfile ./Dockerfile
cp /path/to/sistemcharging/README.md ./README.md

# Push ke HF
git add .
git commit -m "Deploy backend to Hugging Face"
git push
```

### 3c. Set Environment Variables (Backend)

Di Hugging Face Space → **Settings** → **Repository secrets**, tambahkan:

| Key | Value |
|-----|-------|
| `DB_HOST` | host dari Neon |
| `DB_PORT` | `5432` |
| `DB_USER` | user dari Neon |
| `DB_PASSWORD` | password dari Neon |
| `DB_NAME` | nama database Neon |
| `DB_SSLMODE` | `require` |
| `JWT_SECRET` | string random panjang (min 32 karakter) |
| `MQTT_BROKER` | URL HiveMQ (atau kosongkan jika tidak pakai) |
| `SERVER_PORT` | `7860` |

### 3d. Catat URL Backend

Setelah deploy berhasil, URL backend akan menjadi:
```
https://YOUR_USERNAME-sistemcharging-backend.hf.space
```

---

## Langkah 4: Deploy Admin Panel ke Hugging Face

### 4a. Buat Hugging Face Space (Admin)

1. Klik **"New Space"** lagi
2. Isi form:
   - **Space name**: `sistemcharging-admin`
   - **SDK**: Docker
   - **Visibility**: Public
3. Klik **Create Space**

### 4b. Push Code ke Space (Admin)

```bash
# Clone Space admin
git clone https://huggingface.co/spaces/YOUR_USERNAME/sistemcharging-admin

cd sistemcharging-admin

# Copy file admin
cp -r /path/to/sistemcharging/admin/* ./

# Pastikan Dockerfile dan nginx.conf ada
ls Dockerfile nginx.conf

# Push ke HF
git add .
git commit -m "Deploy admin panel to Hugging Face"
git push
```

### 4c. Set Build Variable (Admin)

Di Space Settings → **Build variables** (bukan secrets, karena Vite butuh saat build):

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://YOUR_USERNAME-sistemcharging-backend.hf.space/api/v1` |

> ⚠️ **Penting**: Ganti `YOUR_USERNAME` dengan username HF Anda yang sebenarnya!

---

## Langkah 5: Update Mobile App

Setelah backend HF Space berjalan, update URL di mobile app:

Edit file `mobile/lib/config/app_config.dart`:

```dart
class AppConfig {
  // Ganti dengan URL HF Space Anda
  static const String baseUrl = 'https://YOUR_USERNAME-sistemcharging-backend.hf.space';
  static const String apiUrl = '$baseUrl/api/v1';
  static const String wsUrl = 'wss://YOUR_USERNAME-sistemcharging-backend.hf.space/api/v1/ws';
}
```

---

## Troubleshooting

### Backend tidak mau start
- Cek log di HF Space → **Build logs** / **App logs**
- Pastikan semua env vars sudah diset dengan benar
- Cek koneksi database Neon (pastikan IP tidak diblokir)

### Admin tidak bisa konek ke backend
- Pastikan `VITE_API_URL` sudah benar dan di-rebuild
- Cek CORS di backend (sudah AllowOrigins: `*`)

### Database error
- Pastikan `DB_SSLMODE=require` untuk Neon
- Cek connection string Neon sudah benar

---

## URL Final Setelah Deploy

```
Backend API  : https://YOUR_USERNAME-sistemcharging-backend.hf.space
Admin Panel  : https://YOUR_USERNAME-sistemcharging-admin.hf.space
Health Check : https://YOUR_USERNAME-sistemcharging-backend.hf.space/health
```
