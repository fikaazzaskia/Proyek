<?php
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$no_hp = trim($_GET['no_hp'] ?? '');

if (!$no_hp) {
    http_response_code(420);
    echo json_encode([]);
    exit;
}

// Clean phone number for better match
$clean_no_hp = preg_replace('/[^0-9]/', '', $no_hp);
if (strlen($clean_no_hp) < 5) {
    echo json_encode([]);
    exit;
}

try {
    // We will query bookings that match the phone number (partial match or exact after cleaning)
    // To make it flexible, we query by LIKE matching the clean number
    $stmt = $pdo->prepare("
        SELECT b.id, b.kode_booking, b.nama, b.no_hp, b.jadwal, b.metode_bayar, b.status, b.biaya_admin,
               br.nama as barber
        FROM bookings b
        JOIN barbers br ON b.barber_id = br.id
        WHERE REPLACE(REPLACE(REPLACE(b.no_hp, ' ', ''), '-', ''), '+', '') LIKE ?
        ORDER BY b.jadwal DESC
    ");
    $stmt->execute(['%' . $clean_no_hp . '%']);
    $bookings = $stmt->fetchAll();

    $result = [];
    foreach ($bookings as $b) {
        // Fetch services for this booking
        $stmtServices = $pdo->prepare("
            SELECT s.nama, s.harga, s.durasi 
            FROM booking_services bs
            JOIN services s ON bs.service_id = s.id
            WHERE bs.booking_id = ?
        ");
        $stmtServices->execute([$b['id']]);
        $services = $stmtServices->fetchAll();

        $subtotal = 0;
        $durasi_total = 0;
        $layanan_names = [];
        foreach ($services as $s) {
            $subtotal += floatval($s['harga']);
            $durasi_total += intval($s['durasi']);
            $layanan_names[] = $s['nama'];
        }

        $total_bayar = $subtotal + intval($b['biaya_admin']);

        // Check if cancellable (must be pending, and current time must be at least 2 hours before booking schedule)
        $now = new DateTime();
        $scheduleTime = new DateTime($b['jadwal']);
        $diff = $scheduleTime->getTimestamp() - $now->getTimestamp();
        $is_cancellable = ($b['status'] === 'pending' && $diff >= 7200); // 2 hours = 7200 seconds

        $result[] = [
            'id' => $b['id'],
            'kode_booking' => $b['kode_booking'],
            'nama' => $b['nama'],
            'no_hp' => $b['no_hp'],
            'jadwal' => $b['jadwal'],
            'metode_bayar' => $b['metode_bayar'],
            'status' => $b['status'],
            'biaya_admin' => intval($b['biaya_admin']),
            'barber' => $b['barber'],
            'layanan' => implode(', ', $layanan_names),
            'services' => $services,
            'subtotal' => $subtotal,
            'total_bayar' => $total_bayar,
            'durasi_total' => $durasi_total,
            'is_cancellable' => $is_cancellable
        ];
    }

    echo json_encode($result);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Gagal memuat riwayat booking: ' . $e->getMessage()]);
}
