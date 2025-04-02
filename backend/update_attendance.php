<?php
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Max-Age: 3600');
header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['mssv']) || !isset($data['session_id']) || !isset($data['status'])) {
            throw new Exception('Thiếu thông tin cần thiết');
        }

        $mssv = $data['mssv'];
        $session_id = $data['session_id'];
        $status = $data['status'];
        $date = date('Y-m-d H:i:s');

        // Kiểm tra xem đã điểm danh chưa
        $check_sql = "SELECT id FROM attendance WHERE mssv = ? AND session_id = ?";
        $check_stmt = $conn->prepare($check_sql);
        $check_stmt->bind_param("si", $mssv, $session_id);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();

        if ($check_result->num_rows > 0) {
            // Cập nhật điểm danh
            $sql = "UPDATE attendance SET status = ?, date = ? WHERE mssv = ? AND session_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssi", $status, $date, $mssv, $session_id);
            $message = "Cập nhật điểm danh thành công";
        } else {
            // Thêm điểm danh mới
            $sql = "INSERT INTO attendance (mssv, session_id, status, date) VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("siss", $mssv, $session_id, $status, $date);
            $message = "Thêm điểm danh thành công";
        }

        if ($stmt->execute()) {
            echo json_encode([
                'success' => true,
                'message' => $message
            ]);
        } else {
            throw new Exception('Lỗi khi cập nhật điểm danh');
        }
    } else {
        throw new Exception('Phương thức không được hỗ trợ');
    }

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