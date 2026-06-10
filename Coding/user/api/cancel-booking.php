<?php
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$booking_id = intval($body['id'] ?? 0);

if (!$booking_id) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'ID booking tidak valid']);
    exit;
}

try {
    // Fetch booking
    $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
    $stmt->execute([$booking_id]);
    $booking = $stmt->fetch();

    if (!$booking) {
        http_response_code(444);
        echo json_encode(['success' => false, 'message' => 'Booking tidak ditemukan']);
        exit;
    }

    if ($booking['status'] !== 'pending') {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Hanya booking berstatus pending yang dapat dibatalkan']);
        exit;
    }

    // Check time policy: cancel must be at least 2 hours before schedule
    $now = new DateTime();
    $scheduleTime = new DateTime($booking['jadwal']);
    $diff = $scheduleTime->getTimestamp() - $now->getTimestamp();

    if ($diff < 7200) { // 2 hours = 7200 seconds
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Pembatalan hanya dapat dilakukan maksimal 2 jam sebelum jadwal booking']);
        exit;
    }

    // Set to cancelled
    $stmtUpdate = $pdo->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?");
    $stmtUpdate->execute([$booking_id]);

    echo json_encode(['success' => true, 'message' => 'Booking Anda berhasil dibatalkan']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal memproses pembatalan: ' . $e->getMessage()]);
}
