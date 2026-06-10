<?php
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

$rows = $pdo->query("SELECT * FROM schedules")->fetchAll();
echo json_encode($rows);
