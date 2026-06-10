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



$today = date('Y-m-d');

// Total booking hari ini
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bookings WHERE DATE(jadwal) = ?");
$stmt->execute([$today]);
$totalBooking = $stmt->fetch()['total'];

// Pending hari ini
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bookings WHERE DATE(jadwal) = ? AND status = 'pending'");
$stmt->execute([$today]);
$totalPending = $stmt->fetch()['total'];

// Confirmed hari ini
$stmt = $pdo->prepare("SELECT COUNT(*) as total FROM bookings WHERE DATE(jadwal) = ? AND status = 'confirmed'");
$stmt->execute([$today]);
$totalConfirmed = $stmt->fetch()['total'];

// Pendapatan hari ini (confirmed)
$stmt = $pdo->prepare("
    SELECT COALESCE(SUM(s.harga), 0) as total
    FROM bookings b
    JOIN services s ON b.layanan_id = s.id
    WHERE DATE(b.jadwal) = ? AND b.status = 'confirmed'
");
$stmt->execute([$today]);
$pendapatan = $stmt->fetch()['total'];

// 5 booking terbaru hari ini
$stmt = $pdo->prepare("
    SELECT b.id, b.kode_booking, b.nama, b.no_hp, b.jadwal, b.metode_bayar, b.status,
           s.nama as layanan, s.harga,
           br.nama as barber
    FROM bookings b
    JOIN services s ON b.layanan_id = s.id
    JOIN barbers br ON b.barber_id = br.id
    WHERE DATE(b.jadwal) = ?
    ORDER BY b.created_at DESC
    LIMIT 5
");
$stmt->execute([$today]);
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
