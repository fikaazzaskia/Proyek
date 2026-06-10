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

// GET → ambil semua barbers (termasuk aktif=0)
if ($method === 'GET') {
    $rows = $pdo->query("SELECT * FROM barbers ORDER BY id ASC")->fetchAll();
    echo json_encode($rows);
    exit;
}

// POST → tambah barber baru
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    $nama         = trim($body['nama'] ?? '');
    $spesialisasi = trim($body['spesialisasi'] ?? '');

    if (!$nama) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Nama barber wajib diisi']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO barbers (nama, spesialisasi, aktif) VALUES (?, ?, 1)");
    $stmt->execute([$nama, $spesialisasi]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'message' => 'Barber berhasil ditambahkan']);
    exit;
}

// PATCH → edit barber
if ($method === 'PATCH') {
    $body = json_decode(file_get_contents('php://input'), true);
    $id            = intval($body['id'] ?? 0);
    $nama          = trim($body['nama'] ?? '');
    $spesialisasi  = trim($body['spesialisasi'] ?? '');

    if (!$id) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'ID tidak valid']);
        exit;
    }

    // Toggle aktif/nonaktif saja
    if (isset($body['aktif']) && !$nama) {
        $aktif = intval($body['aktif']);
        $stmt = $pdo->prepare("UPDATE barbers SET aktif = ? WHERE id = ?");
        $stmt->execute([$aktif, $id]);
        echo json_encode(['success' => true, 'message' => 'Status barber berhasil diubah']);
        exit;
    }

    if (!$nama) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Nama barber wajib diisi']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE barbers SET nama = ?, spesialisasi = ? WHERE id = ?");
    $stmt->execute([$nama, $spesialisasi, $id]);

    echo json_encode(['success' => true, 'message' => 'Data barber berhasil diperbarui']);
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

    $stmt = $pdo->prepare("UPDATE barbers SET aktif = 0 WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Barber berhasil dinonaktifkan']);
    exit;
}
