<?php
// api/events.php – Returns dynamic current book data and list of events
// This endpoint can serve multiple purposes based on a 'type' query parameter.
//   type=currentBook -> returns JSON with fields: cover, title, author, progress
//   type=events      -> returns JSON array of events (used by calendar)

require_once __DIR__ . '/config.php';
header('Content-Type: application/json');

$type = $_GET['type'] ?? 'currentBook';

if ($type === 'currentBook') {
    // Example: fetch from a table `config` where key = 'currentBook'
    $stmt = $pdo->prepare('SELECT `value` FROM config WHERE `key` = ?');
    $stmt->execute(['currentBook']);
    $row = $stmt->fetch();
    if ($row) {
        $data = json_decode($row['value'], true);
        echo json_encode($data);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Current book not configured']);
    }
} elseif ($type === 'events') {
    // Return dummy events for the calendar (could be stored in DB)
    $stmt = $pdo->query('SELECT year, month, day, title, type, time, location FROM events ORDER BY year, month, day');
    $events = [];
    while ($row = $stmt->fetch()) {
        $events[] = $row;
    }
    echo json_encode($events);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type parameter']);
}
?>
