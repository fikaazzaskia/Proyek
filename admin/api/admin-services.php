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

// GET → ambil semua services (termasuk aktif=0)
if ($method === 'GET') {
    $rows = $pdo->query("SELECT * FROM services ORDER BY id ASC")->fetchAll();
    echo json_encode($rows);
    exit;
}

// POST → tambah layanan baru
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $nama   = trim($body['nama'] ?? '');
    $durasi = intval($body['durasi'] ?? 0);
    $harga  = floatval($body['harga'] ?? 0);

    if (!$nama || !$durasi || !$harga) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO services (nama, durasi, harga, aktif) VALUES (?, ?, ?, 1)");
    $stmt->execute([$nama, $durasi, $harga]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Layanan berhasil ditambahkan']);
    exit;
}

// PATCH → edit layanan
if ($method === 'PATCH') {
    $body = json_decode(file_get_contents('php://input'), true);
    $id     = intval($body['id'] ?? 0);
    $nama   = trim($body['nama'] ?? '');
    $durasi = intval($body['durasi'] ?? 0);
    $harga  = floatval($body['harga'] ?? 0);

    if (!$id) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'ID tidak valid']);
        exit;
    }

    // Jika ada field aktif saja (toggle aktif/nonaktif)
    if (isset($body['aktif']) && !$nama && !$durasi && !$harga) {
        $aktif = intval($body['aktif']);
        $stmt = $pdo->prepare("UPDATE services SET aktif = ? WHERE id = ?");
        $stmt->execute([$aktif, $id]);
        echo json_encode(['success' => true, 'message' => 'Status layanan berhasil diubah']);
        exit;
    }

    if (!$nama || !$durasi || !$harga) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE services SET nama = ?, durasi = ?, harga = ? WHERE id = ?");
    $stmt->execute([$nama, $durasi, $harga, $id]);

    echo json_encode(['success' => true, 'message' => 'Layanan berhasil diperbarui']);
    exit;
}

// DELETE → soft delete (set aktif=0)
if ($method === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true);
    $id = intval($body['id'] ?? 0);

    if (!$id) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'ID tidak valid']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE services SET aktif = 0 WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Layanan berhasil dinonaktifkan']);
    exit;
}
