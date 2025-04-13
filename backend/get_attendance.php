<?php
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

require_once 'cors.php';
require_once 'config.php';

function writeLog($message)
{
    $logFile = __DIR__ . '/debug.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

try {
    if (!isset($_GET['session_id']) || !isset($_GET['date'])) {
        throw new Exception('Thiếu session_id hoặc date');
    }

    $session_id = $_GET['session_id'];
    $date = $_GET['date'];
    writeLog("Requesting attendance for session_id: $session_id, date: $date");

    $conn = getDBConnection();
    if (!$conn)
        throw new Exception('Không thể kết nối đến cơ sở dữ liệu');

    $check_session = $conn->prepare("SELECT id, date, time_slot, room FROM class_sessions WHERE id = ?");
    $check_session->bind_param("i", $session_id);
    $check_session->execute();
    $session_result = $check_session->get_result();

    if ($session_result->num_rows === 0)
        throw new Exception('Ca học không tồn tại');
    $session_info = $session_result->fetch_assoc();

    $query = "SELECT s.mssv, s.hoten, a.status, a.date 
              FROM students s 
              INNER JOIN class_session_students css ON s.mssv = css.mssv
              LEFT JOIN attendance a ON s.mssv = a.mssv AND a.session_id = ? AND DATE(a.date) = ?
              WHERE css.session_id = ?
              ORDER BY s.hoten";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("isi", $session_id, $date, $session_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        writeLog("No students found for session: $session_id on date: $date");
    }

    $attendance = [];
    while ($row = $result->fetch_assoc()) {
        $attendance[] = [
            'mssv' => $row['mssv'],
            'hoten' => $row['hoten'],
            'status' => $row['status'] ?? 'Chưa điểm danh',
            'time' => $row['date'] ?? null
        ];
    }

    $response = [
        'success' => true,
        'data' => [
            'session' => [
                'id' => $session_info['id'],
                'date' => $session_info['date'],
                'time_slot' => $session_info['time_slot'],
                'room' => $session_info['room']
            ],
            'attendance' => $attendance
        ]
    ];

    writeLog("Successfully retrieved attendance data: " . json_encode($response));
    echo json_encode($response);

} catch (Exception $e) {
    writeLog("Error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($stmt))
        $stmt->close();
    if (isset($check_session))
        $check_session->close();
    if (isset($conn))
        closeDBConnection($conn);
}
?>