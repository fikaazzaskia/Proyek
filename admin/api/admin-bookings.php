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
           s.nama as layanan, s.harga, s.durasi,
           br.nama as barber
    FROM bookings b
    JOIN services s ON b.layanan_id = s.id
    JOIN barbers br ON b.barber_id = br.id
";

if ($status !== 'all' && in_array($status, ['pending', 'confirmed', 'cancelled'])) {
    $sql .= " WHERE b.status = :status";
}

$sql .= " ORDER BY b.jadwal DESC";

$stmt = $pdo->prepare($sql);

if ($status !== 'all' && in_array($status, ['pending', 'confirmed', 'cancelled'])) {
    $stmt->execute(['status' => $status]);
} else {
    $stmt->execute();
}

$bookings = $stmt->fetchAll();

echo json_encode($bookings);
