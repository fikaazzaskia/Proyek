<?php
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

$row = $pdo->query("SELECT * FROM settings LIMIT 1")->fetch();
echo json_encode($row ?: new stdClass());
