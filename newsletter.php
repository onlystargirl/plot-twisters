<?php
// api/newsletter.php – Simple endpoint to receive newsletter subscriptions
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);
if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}
$email = $data['email'];

// For simplicity, store email in a flat file (newsletter_subscribers.txt)
$file = __DIR__ . '/newsletter_subscribers.txt';
$line = $email . "\n";
if (file_put_contents($file, $line, FILE_APPEND | LOCK_EX) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save subscription']);
    exit;
}

echo json_encode(['status' => 'subscribed']);
?>
