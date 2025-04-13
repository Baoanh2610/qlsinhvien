<?php
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    if (!isset($_GET['mssv'])) {
        throw new Exception('Thiếu MSSV');
    }

    $mssv = $_GET['mssv'];
    error_log("Received MSSV: " . $mssv); // Debug MSSV nhận được

    $sql = "SELECT cs.*
            FROM class_sessions cs
            INNER JOIN class_session_students css ON cs.id = css.session_id
            WHERE css.mssv = ?
            ORDER BY cs.date DESC, cs.time_slot";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $mssv);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result) {
        throw new Exception('Lỗi khi truy vấn: ' . $conn->error);
    }

    $sessions = [];
    while ($row = $result->fetch_assoc()) {
        $sessions[] = [
            'id' => $row['id'],
            'date' => $row['date'],
            'time_slot' => $row['time_slot'],
            'room' => $row['room'],
            'created_at' => $row['created_at']
        ];
    }

    error_log("Found sessions: " . count($sessions)); // Debug số ca học tìm thấy
    echo json_encode([
        'success' => true,
        'sessions' => $sessions
    ]);

} catch (Exception $e) {
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