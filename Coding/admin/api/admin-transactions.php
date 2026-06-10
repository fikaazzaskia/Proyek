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
           GROUP_CONCAT(s.nama SEPARATOR ', ') as layanan,
           (SUM(s.harga) + COALESCE(b.biaya_admin, 2000)) as harga,
           SUM(s.durasi) as durasi,
           br.nama as barber
    FROM bookings b
    JOIN booking_services bs ON b.id = bs.booking_id
    JOIN services s ON bs.service_id = s.id
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

$sql .= " GROUP BY b.id ORDER BY b.jadwal DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$bookings = $stmt->fetchAll();

// Hitung total pendapatan (hanya selesai)
$totalSql = "
    SELECT COALESCE(SUM(total), 0) as total FROM (
        SELECT (SUM(s.harga) + COALESCE(b.biaya_admin, 2000)) as total, b.jadwal, b.barber_id, b.metode_bayar, b.status
        FROM bookings b
        JOIN booking_services bs ON b.id = bs.booking_id
        JOIN services s ON bs.service_id = s.id
        GROUP BY b.id
    ) t
    WHERE t.status = 'selesai'
";

$totalParams = [];

if ($from) {
    $totalSql .= " AND DATE(t.jadwal) >= :from_date";
    $totalParams['from_date'] = $from;
}

if ($to) {
    $totalSql .= " AND DATE(t.jadwal) <= :to_date";
    $totalParams['to_date'] = $to;
}

if ($barberId) {
    $totalSql .= " AND t.barber_id = :barber_id";
    $totalParams['barber_id'] = $barberId;
}

if ($metode && in_array($metode, ['QRIS', 'KASIR'])) {
    $totalSql .= " AND t.metode_bayar = :metode";
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
