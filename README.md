# 💈 King Barbershop — Sistem Booking Online

Aplikasi web pemesanan (booking) layanan barbershop online berbasis PHP dan JavaScript (Vanilla JS SPA). Aplikasi ini dirancang dengan arsitektur yang ringan, mudah dideploy, dan kompatibel untuk perangkat desktop maupun mobile.

---

## 📁 Struktur Proyek

Proyek ini telah dikelompokkan ke dalam struktur folder yang rapi dan terorganisir:

- 📂 **[Coding/](file:///c:/xampp/htdocs/barbeshop-main/Coding/)** — Direktori utama berkas kode program.
  - 📂 **[user/](file:///c:/xampp/htdocs/barbeshop-main/Coding/user/)** — Sisi Pelanggan (Pilihan Layanan, Barber, Jadwal, Metode Pembayaran, Konfirmasi, dan Riwayat Booking).
  - 📂 **[admin/](file:///c:/xampp/htdocs/barbeshop-main/Coding/admin/)** — Panel Admin (Dashboard, Booking Masuk, Jadwal Operasional, Data Barber, Kelola Layanan, dan Riwayat Transaksi).
  - 📄 **.env** — Konfigurasi environment (koneksi database dan CORS).
- 📂 **[docs/](file:///c:/xampp/htdocs/barbeshop-main/docs/)** — Dokumen perencanaan rekayasa perangkat lunak (SRS, SDD, UML, WBS, PMP, Test Plan, dll.).
- 📂 **[labs/](file:///c:/xampp/htdocs/barbeshop-main/labs/)** — Direktori berkas praktikum/tugas tambahan tim mahasiswa.

---

## ✨ Fitur-Fitur Unggulan Baru (Technical & Business Upgrade)

### 1. 💵 Biaya Layanan Online (Admin Fee)
- Tambahan biaya admin secara dinamis yang diambil dari database (`settings.biaya_admin`) untuk setiap pemesanan baru.
- Perhitungan pendapatan harian dan total laporan keuangan admin otomatis terakumulasi dengan biaya admin historis.
- Antarmuka konfirmasi pembayaran yang transparan menampilkan rincian: **Subtotal Layanan + Biaya Layanan Online = Total Bayar**.

### 2. 📋 Riwayat & Lacak Booking Pelanggan
- Pelanggan kini dapat melihat kembali riwayat pemesanan mereka kapan saja tanpa perlu mendaftar akun (login).
- Sistem caching lokal (`localStorage`) menyimpan riwayat pemesanan secara otomatis pada perangkat yang digunakan.
- Tersedia fitur pencarian manual dengan memasukkan nomor HP untuk menampilkan daftar pesanan beserta status terkininya.

### 3. 💬 Simulasi Notifikasi & Pengingat WhatsApp
- **WhatsApp Gateway Simulator** bawaan yang menyimulasikan pesan notifikasi sukses setelah booking berhasil lengkap dengan Kode Booking dan detail jadwal.
- Tombol **"Simulasikan Pengingat H-1"** pada layar konfirmasi untuk mendemonstrasikan pengiriman notifikasi pengingat otomatis menjelang hari potong rambut.

### 4. 🔏 Syarat & Ketentuan serta Kebijakan Pembatalan
- Form pemesanan mewajibkan pelanggan menyetujui syarat & ketentuan sebelum melanjutkan ke pembayaran.
- **Kebijakan Pembatalan Mandiri**: Pelanggan dapat membatalkan pesanan (status pending) secara mandiri dari riwayat booking jika waktu jadwal masih berjarak minimal 2 jam.

### 5. 🔒 Penguatan Keamanan Admin Panel
- Mencegah serangan *Session Hijacking* dengan memverifikasi kecocokan `User-Agent` browser admin.
- Mencegah serangan *Session Fixation* melalui fitur regenerasi session ID (`session_regenerate_id(true)`) saat login sukses.
- Otomatis logout (*Inactivity Session Timeout*) jika admin tidak melakukan aktivitas selama 30 menit.

---

## 🚀 Panduan Instalasi & Penggunaan

### 1. Kebutuhan Sistem
- Web Server lokal (misal: **XAMPP** dengan PHP versi 7.4 ke atas).
- Database Server (**MySQL / MariaDB**).

### 2. Impor Database
1. Buka phpMyAdmin (`http://localhost/phpmyadmin`).
2. Buat database baru bernama `barbershop`.
3. Impor berkas SQL yang berada di **[Coding/user/barbershop.sql](file:///c:/xampp/htdocs/barbeshop-main/Coding/user/barbershop.sql)**.

### 3. Konfigurasi Environment
Salin file `.env.example` menjadi `.env` di dalam folder `Coding/` dan sesuaikan credentials database Anda:
```env
DB_HOST=localhost
DB_NAME=barbershop
DB_USER=root
DB_PASS=
ALLOWED_ORIGIN=http://localhost
```

### 4. Menjalankan Aplikasi
Akses aplikasi melalui peramban (browser) dengan URL localhost:
- **Aplikasi Pelanggan (User):**
  `http://localhost/barbeshop-main/Coding/user/`
- **Dashboard Admin:**
  `http://localhost/barbeshop-main/Coding/admin/`
  - *Username Default:* `admin`
  - *Password Default:* `admin123`
