<?php
// Tắt hiển thị lỗi PHP
error_reporting(0);
ini_set('display_errors', 0);

// Đảm bảo luôn trả về JSON
header('Content-Type: application/json');

require_once 'cors.php';
require_once 'config.php';

// Hàm ghi log
function writeLog($message)
{
    $logFile = __DIR__ . '/debug.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

try {
    // Kiểm tra session_id
    if (!isset($_GET['session_id'])) {
        throw new Exception('Thiếu thông tin ca học');
    }

    $session_id = $_GET['session_id'];
    writeLog("Requesting attendance for session_id: $session_id");

    // Kết nối database
    $conn = getDBConnection();
    if (!$conn) {
        writeLog("Database connection failed");
        throw new Exception('Không thể kết nối đến cơ sở dữ liệu');
    }

    // Kiểm tra xem session có tồn tại không
    $check_session = $conn->prepare("SELECT id, date, time_slot, room FROM class_sessions WHERE id = ?");
    if (!$check_session) {
        writeLog("Prepare session check failed: " . $conn->error);
        throw new Exception('Lỗi khi kiểm tra ca học');
    }

    $check_session->bind_param("i", $session_id);
    $check_session->execute();
    $session_result = $check_session->get_result();

    if ($session_result->num_rows === 0) {
        writeLog("Session not found: $session_id");
        throw new Exception('Ca học không tồn tại');
    }

    $session_info = $session_result->fetch_assoc();
    writeLog("Found session: " . json_encode($session_info));

    // Lấy danh sách sinh viên đã đăng ký cho ca học
    $query = "SELECT s.mssv, s.hoten, a.status, a.date 
              FROM students s 
              INNER JOIN session_enrollments se ON s.mssv = se.mssv
              LEFT JOIN attendance a ON s.mssv = a.mssv AND a.session_id = ?
              WHERE se.session_id = ?
              ORDER BY s.hoten";

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        writeLog("Prepare attendance query failed: " . $conn->error);
        throw new Exception('Lỗi khi chuẩn bị truy vấn: ' . $conn->error);
    }

    $stmt->bind_param("ii", $session_id, $session_id);
    if (!$stmt->execute()) {
        writeLog("Execute attendance query failed: " . $stmt->error);
        throw new Exception('Lỗi khi thực thi truy vấn: ' . $stmt->error);
    }

    $result = $stmt->get_result();

    // Kiểm tra xem có sinh viên nào không
    if ($result->num_rows === 0) {
        writeLog("No students found for session: $session_id");
        throw new Exception('Chưa có sinh viên nào đăng ký cho ca học này');
    }

    writeLog("Found " . $result->num_rows . " students");

    $attendance = [];
    while ($row = $result->fetch_assoc()) {
        $attendance[] = [
            'mssv' => $row['mssv'],
            'hoten' => $row['hoten'],
            'status' => $row['status'] ?? 'pending',
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
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($check_session)) {
        $check_session->close();
    }
    if (isset($conn)) {
        closeDBConnection($conn);
    }
}
?>