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



$from      = $_GET['from'] ?? '';
$to        = $_GET['to'] ?? '';
$barberId  = $_GET['barber_id'] ?? '';
$metode    = $_GET['metode'] ?? '';

$sql = "
    SELECT b.id, b.kode_booking, b.nama, b.no_hp, b.jadwal, b.metode_bayar, b.status,
           s.nama as layanan, s.harga, s.durasi,
           br.nama as barber
    FROM bookings b
    JOIN services s ON b.layanan_id = s.id
    JOIN barbers br ON b.barber_id = br.id
    WHERE 1=1
";

$params = [];

if ($from) {
    $sql .= " AND DATE(b.jadwal) >= :from_date";
    $params['from_date'] = $from;
}

if ($to) {
    $sql .= " AND DATE(b.jadwal) <= :to_date";
    $params['to_date'] = $to;
}

if ($barberId) {
    $sql .= " AND b.barber_id = :barber_id";
    $params['barber_id'] = $barberId;
}

if ($metode && in_array($metode, ['QRIS', 'KASIR'])) {
    $sql .= " AND b.metode_bayar = :metode";
    $params['metode'] = $metode;
}

$sql .= " ORDER BY b.jadwal DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$bookings = $stmt->fetchAll();

// Hitung total pendapatan (hanya confirmed)
$totalSql = "
    SELECT COALESCE(SUM(s.harga), 0) as total
    FROM bookings b
    JOIN services s ON b.layanan_id = s.id
    WHERE b.status = 'confirmed'
";

$totalParams = [];

if ($from) {
    $totalSql .= " AND DATE(b.jadwal) >= :from_date";
    $totalParams['from_date'] = $from;
}

if ($to) {
    $totalSql .= " AND DATE(b.jadwal) <= :to_date";
    $totalParams['to_date'] = $to;
}

if ($barberId) {
    $totalSql .= " AND b.barber_id = :barber_id";
    $totalParams['barber_id'] = $barberId;
}

if ($metode && in_array($metode, ['QRIS', 'KASIR'])) {
    $totalSql .= " AND b.metode_bayar = :metode";
    $totalParams['metode'] = $metode;
}

$totalStmt = $pdo->prepare($totalSql);
$totalStmt->execute($totalParams);
$totalPendapatan = $totalStmt->fetch()['total'];

// Ambil daftar barber untuk filter
$barbers = $pdo->query("SELECT id, nama FROM barbers ORDER BY nama")->fetchAll();

echo json_encode([
    'bookings'         => $bookings,
    'total_pendapatan' => (float)$totalPendapatan,
    'barbers'          => $barbers
]);
