<?php
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

try {
    $rows = $pdo->query("SELECT * FROM barbers WHERE aktif = 1")->fetchAll();
    echo json_encode($rows);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Gagal memuat data barber']);
}
