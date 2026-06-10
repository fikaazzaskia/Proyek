CREATE DATABASE IF NOT EXISTS barbershop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE barbershop;

CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_barbershop VARCHAR(100) DEFAULT 'Barbershop',
    tagline VARCHAR(200) DEFAULT 'Style Starts Here',
    qris_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    durasi INT NOT NULL,
    harga DECIMAL(10,0) NOT NULL,
    aktif TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE barbers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    spesialisasi VARCHAR(100),
    aktif TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hari ENUM('Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu') NOT NULL,
    libur TINYINT(1) DEFAULT 0,
    jam_buka TIME DEFAULT '08:00:00',
    jam_tutup TIME DEFAULT '21:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_booking VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    no_hp VARCHAR(20) NOT NULL,
    layanan_id INT NOT NULL,
    barber_id INT NOT NULL,
    jadwal DATETIME NOT NULL,
    metode_bayar ENUM('QRIS','KASIR') NOT NULL,
    status ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (layanan_id) REFERENCES services(id),
    FOREIGN KEY (barber_id) REFERENCES barbers(id)
);

INSERT INTO settings (nama_barbershop, tagline, qris_image_url) VALUES
('King Barbershop', 'Style Starts Here', '');

INSERT INTO services (nama, durasi, harga) VALUES
('Potong Rambut', 30, 25000),
('Cukur Jenggot', 20, 15000),
('Potong + Cuci', 45, 35000),
('Pewarnaan Rambut', 60, 75000);

INSERT INTO barbers (nama, spesialisasi) VALUES
('Budi Santoso', 'Fade & Undercut'),
('Andi Pratama', 'Classic & Modern');

INSERT INTO schedules (hari, libur, jam_buka, jam_tutup) VALUES
('Minggu', 1, '08:00', '21:00'),
('Senin',  0, '08:00', '21:00'),
('Selasa', 0, '08:00', '21:00'),
('Rabu',   0, '08:00', '21:00'),
('Kamis',  0, '08:00', '21:00'),
('Jumat',  0, '08:00', '21:00'),
('Sabtu',  0, '08:00', '21:00');
