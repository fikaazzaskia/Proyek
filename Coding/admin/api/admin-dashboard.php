<?php
session_start();
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

if (!isset($_SESSION['admin'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}



// Total booking
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bookings");
$stmt->execute();
$totalBooking = $stmt->fetch()['total'];

// Pending
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bookings WHERE status = 'pending'");
$stmt->execute();
$totalPending = $stmt->fetch()['total'];

// Confirmed
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bookings WHERE status = 'selesai'");
$stmt->execute();
$totalConfirmed = $stmt->fetch()['total'];

// Pendapatan (selesai)
$stmt = $pdo->prepare("
    SELECT COALESCE(SUM(total), 0) as total FROM (
        SELECT (SUM(s.harga) + COALESCE(b.biaya_admin, 2000)) as total, b.status
        FROM bookings b
        JOIN booking_services bs ON b.id = bs.booking_id
        JOIN services s ON bs.service_id = s.id
        GROUP BY b.id
    ) t
    WHERE t.status = 'selesai'
");
$stmt->execute();
$pendapatan = $stmt->fetch()['total'];

// 5 booking terbaru
$stmt = $pdo->prepare("
    SELECT b.id, b.kode_booking, b.nama, b.no_hp, b.jadwal, b.metode_bayar, b.status,
           GROUP_CONCAT(s.nama SEPARATOR ', ') as layanan,
           (SUM(s.harga) + COALESCE(b.biaya_admin, 2000)) as harga,
           br.nama as barber
    FROM bookings b
    JOIN booking_services bs ON b.id = bs.booking_id
    JOIN services s ON bs.service_id = s.id
    JOIN barbers br ON b.barber_id = br.id
    GROUP BY b.id
    ORDER BY b.created_at DESC
    LIMIT 5
");
$stmt->execute();
$recentBookings = $stmt->fetchAll();

// Settings
$settings = $pdo->query("SELECT * FROM settings LIMIT 1")->fetch();

echo json_encode([
    'total_booking'   => (int)$totalBooking,
    'total_pending'   => (int)$totalPending,
    'total_confirmed' => (int)$totalConfirmed,
    'pendapatan'      => (float)$pendapatan,
    'recent_bookings' => $recentBookings,
    'settings'        => $settings
]);
