<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    if (!isset($_GET['mssv'])) {
        throw new Exception('Thiếu MSSV');
    }

    $mssv = $_GET['mssv'];
    $conn = getDBConnection();

    $sql = "SELECT a.status, a.date AS time, cs.date, cs.time_slot, cs.room
            FROM attendance a
            INNER JOIN class_sessions cs ON a.session_id = cs.id
            WHERE a.mssv = ?
            ORDER BY cs.date DESC, cs.time_slot DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $mssv);
    $stmt->execute();
    $result = $stmt->get_result();

    $attendance = [];
    while ($row = $result->fetch_assoc()) {
        $attendance[] = [
            'date' => $row['date'],
            'time_slot' => $row['time_slot'],
            'room' => $row['room'],
            'status' => $row['status'],
            'time' => $row['time']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'attendance' => $attendance
        ]
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
}
?>