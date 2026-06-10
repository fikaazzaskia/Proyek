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



$status = $_GET['status'] ?? 'all';

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
";

if ($status !== 'all' && in_array($status, ['pending', 'selesai', 'cancelled'])) {
    $sql .= " WHERE b.status = :status";
}

$sql .= " GROUP BY b.id ORDER BY b.jadwal DESC";

$stmt = $pdo->prepare($sql);

if ($status !== 'all' && in_array($status, ['pending', 'selesai', 'cancelled'])) {
    $stmt->execute(['status' => $status]);
} else {
    $stmt->execute();
}

$bookings = $stmt->fetchAll();

echo json_encode($bookings);
