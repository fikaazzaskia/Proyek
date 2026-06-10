<?php
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$body = json_decode(file_get_contents('php://input'), true);

$nama        = trim($body['nama'] ?? '');
$no_hp       = trim($body['no_hp'] ?? '');
$layanan_id  = intval($body['layanan_id'] ?? 0);
$barber_id   = intval($body['barber_id'] ?? 0);
$jadwal      = $body['jadwal'] ?? '';
$metode      = $body['metode_bayar'] ?? '';

if (!$nama || !$no_hp || !$layanan_id || !$barber_id || !$jadwal || !$metode) {
    http_response_code(422);
    echo json_encode(['message' => 'Data tidak lengkap']);
    exit;
}

if (!in_array($metode, ['QRIS', 'KASIR'])) {
    http_response_code(422);
    echo json_encode(['message' => 'Metode bayar tidak valid']);
    exit;
}

// Validasi backend: cek apakah tanggal diblokir
$stmtBlocked = $pdo->prepare("SELECT id FROM blocked_dates WHERE tanggal = DATE(?)");
$stmtBlocked->execute([$jadwal]);
if ($stmtBlocked->fetch()) {
    http_response_code(422);
    echo json_encode(['message' => 'Tanggal ini tidak tersedia untuk booking']);
    exit;
}

// Validasi backend: cek slot sudah terisi (barber yang sama, waktu yang sama)
$stmtSlot = $pdo->prepare("
    SELECT id FROM bookings 
    WHERE barber_id = ? AND jadwal = ? AND status IN ('pending', 'confirmed')
");
$stmtSlot->execute([$barber_id, $jadwal]);
if ($stmtSlot->fetch()) {
    http_response_code(409);
    echo json_encode(['message' => 'Slot waktu ini sudah dipesan, silakan pilih waktu lain']);
    exit;
}

$kode = 'BRB-' . strtoupper(substr(uniqid(), -6));

$stmt = $pdo->prepare("
    INSERT INTO bookings (kode_booking, nama, no_hp, layanan_id, barber_id, jadwal, metode_bayar, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
");
$stmt->execute([$kode, $nama, $no_hp, $layanan_id, $barber_id, $jadwal, $metode]);

echo json_encode(['kode_booking' => $kode]);
