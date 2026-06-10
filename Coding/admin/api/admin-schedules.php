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



$method = $_SERVER['REQUEST_METHOD'];

// GET → ambil semua jadwal (7 hari)
if ($method === 'GET') {
    $rows = $pdo->query("SELECT * FROM schedules ORDER BY FIELD(hari, 'Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')")->fetchAll();
    echo json_encode($rows);
    exit;
}

// PATCH → update jadwal per hari
if ($method === 'PATCH') {
    $body = json_decode(file_get_contents('php://input'), true);
    $id        = intval($body['id'] ?? 0);
    $libur     = intval($body['libur'] ?? 0);
    $jam_buka  = $body['jam_buka'] ?? '';
    $jam_tutup = $body['jam_tutup'] ?? '';

    if (!$id) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'ID tidak valid']);
        exit;
    }

    if (!$jam_buka || !$jam_tutup) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Jam buka dan tutup wajib diisi']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE schedules SET libur = ?, jam_buka = ?, jam_tutup = ? WHERE id = ?");
    $stmt->execute([$libur, $jam_buka, $jam_tutup, $id]);

    echo json_encode(['success' => true, 'message' => 'Jadwal berhasil diperbarui']);
    exit;
}
