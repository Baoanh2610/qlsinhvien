<?php
require_once 'config.php'; // Giả sử file này chứa hàm getDBConnection() và closeDBConnection()

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

// Tắt hiển thị lỗi trực tiếp
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/wamp64/logs/php_error.log');

try {
    $conn = getDBConnection(); // Lấy kết nối từ config.php

    // Kiểm tra phương thức
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Phương thức không được hỗ trợ');
    }

    // Lấy dữ liệu từ body
    $rawData = file_get_contents('php://input');
    $data = json_decode($rawData, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Dữ liệu JSON không hợp lệ');
    }

    // Lấy các trường
    $session_id = $data['session_id'] ?? null;
    $message = $data['message'] ?? '';
    $created_by = $data['created_by'] ?? 1;

    if (!$session_id || !$message) {
        throw new Exception('Thiếu session_id hoặc message');
    }

    // Thêm thông báo vào cơ sở dữ liệu
    $sql = "INSERT INTO notifications (session_id, message, created_by, created_at) 
            VALUES (?, ?, ?, NOW())";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Lỗi chuẩn bị câu lệnh SQL: ' . $conn->error);
    }

    $stmt->bind_param("isi", $session_id, $message, $created_by);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Gửi thông báo thành công'
        ]);
    } else {
        throw new Exception('Không thể lưu thông báo');
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        closeDBConnection($conn); // Đóng kết nối
    }
}
?>