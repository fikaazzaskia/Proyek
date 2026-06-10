-- ============================================================
-- DATA DUMMY BOOKING UNTUK TESTING ADMIN PANEL
-- Jalankan setelah barbershop.sql sudah di-import
-- ============================================================

USE barbershop;

-- Pastikan tabel blocked_dates sudah ada
CREATE TABLE IF NOT EXISTS blocked_dates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATE NOT NULL,
    keterangan VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert booking dummy
-- Pastikan layanan_id dan barber_id sesuai dengan data yang ada
INSERT INTO bookings (kode_booking, nama, no_hp, layanan_id, barber_id, jadwal, metode_bayar, status) VALUES
('BRB-A1B2C3', 'Rudi Hartono',  '08111222333', 1, 1, '2025-01-21 10:00:00', 'KASIR', 'pending'),
('BRB-D4E5F6', 'Sinta Dewi',    '08222333444', 2, 2, '2025-01-21 11:00:00', 'QRIS',  'confirmed'),
('BRB-G7H8I9', 'Joko Prabowo',  '08333444555', 3, 1, '2025-01-21 13:00:00', 'KASIR', 'cancelled');

-- Tambahan booking hari ini agar dashboard terisi
-- (Ganti tanggal CURDATE() agar sesuai hari ini)
INSERT INTO bookings (kode_booking, nama, no_hp, layanan_id, barber_id, jadwal, metode_bayar, status) VALUES
('BRB-T0DAY1', 'Ahmad Fauzi',   '08123456789', 1, 1, CONCAT(CURDATE(), ' 09:00:00'), 'QRIS',  'pending'),
('BRB-T0DAY2', 'Budi Raharjo',  '08234567890', 3, 2, CONCAT(CURDATE(), ' 10:30:00'), 'KASIR', 'confirmed'),
('BRB-T0DAY3', 'Dimas Prasetya','08345678901', 2, 1, CONCAT(CURDATE(), ' 14:00:00'), 'QRIS',  'pending'),
('BRB-T0DAY4', 'Eko Saputra',   '08456789012', 4, 2, CONCAT(CURDATE(), ' 15:30:00'), 'KASIR', 'confirmed'),
('BRB-T0DAY5', 'Fajar Nugroho', '08567890123', 1, 1, CONCAT(CURDATE(), ' 16:00:00'), 'QRIS',  'cancelled');

-- Contoh blocked date
INSERT INTO blocked_dates (tanggal, keterangan) VALUES
('2025-12-25', 'Libur Natal'),
('2025-01-01', 'Tahun Baru');
