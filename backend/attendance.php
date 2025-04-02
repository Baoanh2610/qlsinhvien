<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Lấy danh sách điểm danh theo session
        if (!isset($_GET['session_id'])) {
            throw new Exception('Thiếu session_id');
        }

        $session_id = intval($_GET['session_id']);

        $sql = "SELECT a.*, s.hoten, s.lop 
                FROM attendance a 
                INNER JOIN students s ON a.mssv = s.mssv 
                WHERE a.session_id = ?";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $session_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $attendance = [];
        while ($row = $result->fetch_assoc()) {
            $attendance[] = [
                'id' => $row['id'],
                'mssv' => $row['mssv'],
                'hoten' => $row['hoten'],
                'lop' => $row['lop'],
                'status' => $row['status'],
                'date' => $row['date'],
                'session_id' => $row['session_id']
            ];
        }

        handleSuccess(['attendance' => $attendance]);

    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Xử lý điểm danh
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['mssv']) || !isset($data['status']) || !isset($data['session_id'])) {
            throw new Exception('Thiếu thông tin cần thiết');
        }

        $mssv = $data['mssv'];
        $status = $data['status'];
        $session_id = intval($data['session_id']);
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
    if (isset($conn)) {
        closeDBConnection($conn);
    }
}
?>