<?php
// Load .env file if it exists
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if (!getenv($key)) {
            putenv("$key=$value");
        }
    }
}

$host    = getenv('DB_HOST') ?: 'localhost';
$db      = getenv('DB_NAME') ?: 'barbershop';
$user    = getenv('DB_USER') ?: 'root';
$pass    = getenv('DB_PASS') ?: '';
$charset = 'utf8mb4';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Koneksi database gagal']);
    exit;
}

/**
 * Set CORS headers based on ALLOWED_ORIGIN environment variable.
 */
function setCorsHeaders() {
    $allowed = getenv('ALLOWED_ORIGIN') ?: 'http://localhost';
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($origin && $origin === $allowed) {
        header("Access-Control-Allow-Origin: $origin");
    } else {
        header("Access-Control-Allow-Origin: $allowed");
    }
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Session Hijacking Protection & Inactivity Timeout Check (30 mins)
if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['admin'])) {
    if (!isset($_SESSION['user_agent']) || $_SESSION['user_agent'] !== ($_SERVER['HTTP_USER_AGENT'] ?? '')) {
        session_destroy();
        http_response_code(401);
        echo json_encode(['error' => 'Sesi tidak valid (Keamanan terganggu)']);
        exit;
    }

    $timeout = 1800; // 30 minutes in seconds
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > $timeout)) {
        session_destroy();
        http_response_code(401);
        echo json_encode(['error' => 'Sesi Anda telah kedaluwarsa karena tidak ada aktivitas']);
        exit;
    }
    $_SESSION['last_activity'] = time();
}

