<?php
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$body = json_decode(file_get_contents('php://input'), true);

$nama        = trim($body['nama'] ?? '');
$no_hp       = trim($body['no_hp'] ?? '');
$barber_id   = intval($body['barber_id'] ?? 0);
$jadwal      = $body['jadwal'] ?? '';
$metode      = $body['metode_bayar'] ?? '';

// Parse multiple service IDs
$layanan_ids = $body['layanan_ids'] ?? [];
if (!is_array($layanan_ids)) {
    $layanan_ids = [$layanan_ids];
}
if (empty($layanan_ids) && !empty($body['layanan_id'])) {
    $layanan_ids = [intval($body['layanan_id'])];
}
$layanan_ids = array_filter(array_map('intval', $layanan_ids));

if (!$nama || !$no_hp || empty($layanan_ids) || !$barber_id || !$jadwal || !$metode) {
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
    WHERE barber_id = ? AND jadwal = ? AND status IN ('pending', 'selesai')
");
$stmtSlot->execute([$barber_id, $jadwal]);
if ($stmtSlot->fetch()) {
    http_response_code(409);
    echo json_encode(['message' => 'Slot waktu ini sudah dipesan, silakan pilih waktu lain']);
    exit;
}

$kode = 'BRB-' . strtoupper(substr(uniqid(), -6));
$layanan_id_primary = $layanan_ids[0]; // first service ID for backward compatibility

// Fetch current admin fee from settings
$stmtSettings = $pdo->query("SELECT biaya_admin FROM settings LIMIT 1");
$settingsRow = $stmtSettings->fetch();
$biaya_admin = $settingsRow ? intval($settingsRow['biaya_admin']) : 2000;

try {
    $pdo->beginTransaction();

    // Insert into bookings table with historical admin fee
    $stmt = $pdo->prepare("
        INSERT INTO bookings (kode_booking, nama, no_hp, layanan_id, barber_id, jadwal, metode_bayar, status, biaya_admin)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    ");
    $stmt->execute([$kode, $nama, $no_hp, $layanan_id_primary, $barber_id, $jadwal, $metode, $biaya_admin]);
    $booking_id = $pdo->lastInsertId();

    // Insert all selected services into booking_services table
    $stmtBS = $pdo->prepare("INSERT INTO booking_services (booking_id, service_id) VALUES (?, ?)");
    foreach ($layanan_ids as $id) {
        $stmtBS->execute([$booking_id, $id]);
    }

    $pdo->commit();
    echo json_encode(['kode_booking' => $kode]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['message' => 'Gagal menyimpan booking: ' . $e->getMessage()]);
    exit;
}
