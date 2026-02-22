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

## 3. Penyelesaian Masalah (Troubleshooting)
- **Koneksi Gagal**: Pastikan internet aktif. Jika dashboard admin tidak update, pastikan service Backend (Go) sedang berjalan.
- **Simulator IoT**: Jika ingin mencoba simulasi tanpa mesin asli, jalankan `go run simulator.go` di folder `iot-simulator`.

---

> [!IMPORTANT]
> Sistem ini dikembangkan untuk memberikan kemudahan bagi ekosistem kendaraan listrik di Indonesia. Gunakan fitur **Monitoring** untuk menjaga efisiensi alat.
