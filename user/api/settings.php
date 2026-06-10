<?php
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

try {
    $row = $pdo->query("SELECT * FROM settings LIMIT 1")->fetch();
    echo json_encode($row ?: new stdClass());
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Gagal memuat pengaturan']);
}
