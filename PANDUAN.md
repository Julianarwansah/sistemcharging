# Panduan Penggunaan SistemCharging ⚡

Buku panduan ini menjelaskan langkah-langkah penggunaan SistemCharging baik untuk **Administrator** (Pengelola) maupun **Customer** (Pengguna App).

---

## 1. Panduan Administrator (Dashboard Admin)
Untuk mengelola infrastruktur, memantau transaksi, dan mengatur stasiun.

### A. Akses Dashboard
1. Buka browser dan akses URL Admin (biasanya `http://localhost:5173`).
2. Login menggunakan kredensial admin Anda.
3. Anda akan masuk ke **Dashboard** yang menampilkan ringkasan performa real-time.

### B. Mengelola Stasiun & Konektor
1. Buka menu **Stations** di sidebar.
2. Untuk menambah stasiun baru, klik tombol **Add Station**.
3. Isi detail stasiun (Nama, Alamat, Koordinat).
4. Di dalam stasiun, Anda dapat menambah **Connector** (titik pengisian), mengatur tarif per kWh, dan menentukan topic MQTT untuk komunikasi IoT.

### C. Pemantauan Real-time (Live Monitoring)
1. Dashboard utama memiliki bagian **Monitoring Sesi Aktif**.
2. Anda bisa melihat siapa yang sedang charging, progres baterai (%), dan konsumsi energi secara langsung tanpa perlu refresh halaman.

### D. Manajemen Pengguna & Laporan
1. Cek menu **Users** untuk melihat daftar pelanggan dan saldo mereka.
2. Cek menu **Transactions** untuk melihat riwayat keuangan lengkap.

---

## 2. Panduan Customer (Aplikasi Mobile)
Langkah-langkah bagi pemilik motor listrik untuk melakukan pengisian daya.

### A. Registrasi & Top-Up
1. Buka aplikasi **SistemCharging** di smartphone.
2. Daftar akun baru atau login.
3. Masuk ke menu **Profile** -> **Top Up** untuk menambah saldo (E-Wallet).

### B. Menemukan Stasiun
1. Gunakan menu **Map** untuk melihat lokasi stasiun terdekat.
2. Klik penanda (marker) untuk melihat status stasiun (Aktif/Rusak) dan jumlah konektor yang tersedia.

### C. Memulai Pengisian (The Flow)
1. **Scan QR**: Klik tombol scan di aplikasi dan arahkan ke kode QR yang ada di mesin charger.
2. **Setup**: Pilih jumlah energi (kWh) yang ingin diisi. Estimasi biaya akan muncul otomatis.
3. **Bayar**: Klik **Bayar & Mulai**. Saldo akan dipotong sesuai estimasi.
4. **Monitoring**: Aplikasi akan masuk ke layar **Charging**. Anda bisa melihat progres pengisian secara real-time.

### D. Selesai Pengisian
1. Pengisian akan berhenti otomatis jika target kWh tercapai atau baterai penuh.
2. Anda juga bisa mengklik tombol **Stop Charging** jika ingin berhenti lebih awal.
3. Struk transaksi akan muncul di menu **History**.

---

## 3. Detail Teknis & Simulasi (IoT Simulator)
Sistem ini menggunakan simulator berbasis Go untuk meniru perilaku hardware pengisian daya di lapangan.

### A. Cara Kerja Simulator
1. **MQTT Communication**: Simulator terhubung ke broker MQTT (localhost:1883).
2. **Command Handling**: Simulator mendengarkan perintah `START` dan `STOP` dari backend.
3. **Progres Real-time**: Saat menerima perintah `START`, simulator akan mengirimkan update penggunaan energi (kWh) dan persentase baterai setiap 3 detik secara otomatis ke backend.
4. **Sinkronisasi Target**: Simulator sekarang mendukung sinkronisasi `Target kWh` yang dipilih pengguna di aplikasi mobile.

### B. Menjalankan Simulasi
1. Buka terminal baru.
2. Masuk ke folder simulator: `cd iot-simulator`.
3. Jalankan: `go run simulator.go`.
4. Perhatikan log di terminal untuk melihat aktivitas "Charging..." saat sesi dimulai dari aplikasi mobile.

---

## 4. Penyelesaian Masalah (Troubleshooting)
- **Koneksi Gagal**: Pastikan broker MQTT (Mosquitto/emqx) sudah menyala di background.
- **Admin Dashboard Tidak Refresh**: Pastikan koneksi internet stabil dan service Backend (Go) sudah direstart setelah perubahan kode terbaru.
- **Data Tidak Masuk**: Cek `CHARGER_ID` di simulator (default: `simulator-001`) harus sesuai dengan `MQTT Topic` yang didaftarkan di dashboard admin (format topic: `charger/simulator-001`).

---

> [!IMPORTANT]
> Sistem ini dikembangkan untuk memberikan kemudahan bagi ekosistem kendaraan listrik di Indonesia. Gunakan fitur **Monitoring** di dashboard admin untuk menjaga efisiensi alat.
