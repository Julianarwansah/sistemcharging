---
title: SistemCharging Admin
emoji: 🔌
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# SistemCharging Admin Panel ⚡

Dashboard admin untuk sistem charging motor listrik.

## Environment Variables

Set di Hugging Face Space Settings → Repository secrets:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | URL Backend API | `https://your-username-sistemcharging-backend.hf.space/api/v1` |

## Deploy ke Hugging Face

1. Buat Space baru di Hugging Face (SDK: Docker)
2. Push folder `admin/` sebagai root repo Space
3. Set `VITE_API_URL` di Space Settings
