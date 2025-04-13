<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'cors.php';
require_once 'config.php';

// Lấy kết nối MySQLi
$conn = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $notification_id = $data['notification_id'] ?? null;
    $student_mssv = $data['student_mssv'] ?? null;

    if (!$notification_id || !$student_mssv) {
        echo json_encode(['success' => false, 'message' => 'Thiếu thông tin bắt buộc']);
        closeDBConnection($conn);
        exit;
    }

    try {
        $stmt = $conn->prepare("
            INSERT INTO notification_status (notification_id, student_id, is_read)
            VALUES (?, ?, TRUE)
            ON DUPLICATE KEY UPDATE is_read = TRUE
        ");

        if (!$stmt) {
            handleError('Lỗi chuẩn bị truy vấn: ' . $conn->error);
        }

        $stmt->bind_param('is', $notification_id, $student_mssv);
        $stmt->execute();
        $stmt->close();

        echo json_encode(['success' => true, 'message' => 'Đánh dấu đã đọc thành công']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Phương thức không được hỗ trợ']);
}

closeDBConnection($conn);
?>