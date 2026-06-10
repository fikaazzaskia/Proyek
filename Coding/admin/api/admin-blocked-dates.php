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



// Buat tabel blocked_dates jika belum ada
$pdo->exec("
    CREATE TABLE IF NOT EXISTS blocked_dates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal DATE NOT NULL,
        keterangan VARCHAR(200),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
");

$method = $_SERVER['REQUEST_METHOD'];

// GET → ambil semua tanggal terblokir
if ($method === 'GET') {
    $rows = $pdo->query("SELECT * FROM blocked_dates ORDER BY tanggal ASC")->fetchAll();
    echo json_encode($rows);
    exit;
}

// POST → tambah tanggal blokir
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $tanggal    = $body['tanggal'] ?? '';
    $keterangan = trim($body['keterangan'] ?? '');

    if (!$tanggal) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Tanggal wajib diisi']);
        exit;
    }

    // Cek duplikat
    $stmt = $pdo->prepare("SELECT id FROM blocked_dates WHERE tanggal = ?");
    $stmt->execute([$tanggal]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Tanggal sudah diblokir sebelumnya']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO blocked_dates (tanggal, keterangan) VALUES (?, ?)");
    $stmt->execute([$tanggal, $keterangan]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Tanggal berhasil diblokir']);
    exit;
}

// DELETE → hapus tanggal blokir
if ($method === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true);
    $id = intval($body['id'] ?? 0);

    if (!$id) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'ID tidak valid']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM blocked_dates WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Tanggal blokir berhasil dihapus']);
    exit;
}
