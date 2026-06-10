<?php
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

$date     = $_GET['date'] ?? '';
$barberId = $_GET['barber_id'] ?? '';

$stmt = $pdo->prepare("
    SELECT jadwal FROM bookings
    WHERE barber_id = ? AND DATE(jadwal) = ? AND status IN ('pending','selesai')
");
$stmt->execute([$barberId, $date]);

$slots = array_map(fn($r) => substr($r['jadwal'], 11, 5), $stmt->fetchAll());
echo json_encode($slots);
