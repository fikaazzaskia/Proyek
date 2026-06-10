<?php
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

$rows = $pdo->query("SELECT * FROM services WHERE aktif = 1")->fetchAll();
echo json_encode($rows);
