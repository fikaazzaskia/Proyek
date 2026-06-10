<?php
session_start();
require 'koneksi.php';
header('Content-Type: application/json');
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

// GET → cek status login
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_SESSION['admin'])) {
        echo json_encode(['logged_in' => true, 'username' => $_SESSION['admin']]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
    exit;
}

// POST → proses login / logout
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    // Logout
    if (isset($body['action']) && $body['action'] === 'logout') {
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Logout berhasil']);
        exit;
    }

    // Login
    $username = trim($body['username'] ?? '');
    $password = trim($body['password'] ?? '');

    $stmt = $pdo->prepare("SELECT * FROM admin_users WHERE username = ?");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if ($admin && password_verify($password, $admin['password'])) {
        session_regenerate_id(true); // Prevent session fixation
        $_SESSION['admin'] = $admin['username'];
        $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $_SESSION['last_activity'] = time();
        echo json_encode(['success' => true, 'message' => 'Login berhasil']);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Username atau password salah']);
    }
    exit;
}
