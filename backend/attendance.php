<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['mssv']) || !isset($data['status']) || !isset($data['session_id']) || !isset($data['date'])) {
            throw new Exception('Thiếu thông tin cần thiết');
        }

        $mssv = $data['mssv'];
        $status = $data['status'];
        $session_id = intval($data['session_id']);
        $date = $data['date'] . ' ' . date('H:i:s'); // Thêm giờ phút giây

        $check_sql = "SELECT id FROM attendance WHERE mssv = ? AND session_id = ? AND DATE(date) = ?";
        $check_stmt = $conn->prepare($check_sql);
        $check_stmt->bind_param("sis", $mssv, $session_id, $data['date']);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();

        if ($check_result->num_rows > 0) {
            $sql = "UPDATE attendance SET status = ?, date = ? WHERE mssv = ? AND session_id = ? AND DATE(date) = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssis", $status, $date, $mssv, $session_id, $data['date']);
            $message = "Cập nhật điểm danh thành công";
        } else {
            $sql = "INSERT INTO attendance (mssv, status, date, session_id) VALUES (?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssi", $mssv, $status, $date, $session_id);
            $message = "Thêm điểm danh thành công";
        }

        if ($stmt->execute()) {
            handleSuccess(['message' => $message]);
        } else {
            throw new Exception('Thao tác thất bại');
        }
    } else {
        throw new Exception('Phương thức không được hỗ trợ');
    }

} catch (Exception $e) {
    handleError($e->getMessage());
} finally {
    if (isset($conn))
        closeDBConnection($conn);
}
?>