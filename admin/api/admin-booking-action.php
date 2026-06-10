<?php
session_start();
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

if (!isset($_SESSION['admin'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}



$body = json_decode(file_get_contents('php://input'), true);

$id     = intval($body['id'] ?? 0);
$action = $body['action'] ?? '';

if (!$id || !in_array($action, ['confirm', 'cancel'])) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Data tidak valid']);
    exit;
}

$newStatus = $action === 'confirm' ? 'confirmed' : 'cancelled';

// Cek apakah booking masih pending
$stmt = $pdo->prepare("SELECT status FROM bookings WHERE id = ?");
$stmt->execute([$id]);
$booking = $stmt->fetch();

if (!$booking) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Booking tidak ditemukan']);
    exit;
}

if ($booking['status'] !== 'pending') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Booking sudah diproses sebelumnya']);
    exit;
}

$stmt = $pdo->prepare("UPDATE bookings SET status = ? WHERE id = ?");
$stmt->execute([$newStatus, $id]);

echo json_encode(['success' => true, 'message' => 'Status berhasil diubah ke ' . $newStatus]);
