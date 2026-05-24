<?php
// api/auth.php – Handles login via POST
// Expected POST parameters:
//   action: 'login'
//   email, password

session_start();
require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

$action = $input['action'] ?? '';
$email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
$password = $input['password'] ?? '';

if ($action !== 'login' || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields or invalid action']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT id, password_hash, display_name FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($password, $row['password_hash'])) {
        throw new Exception('Invalid email or password');
    }
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['email'] = $email;
    $_SESSION['display_name'] = $row['display_name'];
    echo json_encode(['status' => 'logged_in', 'userId' => $row['id']]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
