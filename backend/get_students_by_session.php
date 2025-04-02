<?php
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Max-Age: 3600');

try {
    $conn = getDBConnection();

    if (!isset($_GET['session_id'])) {
        throw new Exception('Thiếu session_id');
    }

    $session_id = $_GET['session_id'];

    // Sửa câu truy vấn: dùng css.mssv và s.mssv thay vì css.student_id và s.id
    $sql = "SELECT s.* 
            FROM students s 
            INNER JOIN class_session_students css ON s.mssv = css.mssv 
            WHERE css.session_id = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $session_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result) {
        throw new Exception('Lỗi khi truy vấn: ' . $conn->error);
    }

    $students = [];
    while ($row = $result->fetch_assoc()) {
        error_log("Row data: " . print_r($row, true)); // Log dữ liệu từng row
        $students[] = [
            'mssv' => $row['mssv'],
            'hoten' => $row['hoten'],
            'khoa' => $row['khoa'],
            'lop' => $row['lop']
        ];
    }

    error_log("Total students found: " . count($students)); // Log tổng số sinh viên tìm thấy

    // Trả về định dạng JSON đúng với frontend
    $response = [
        'success' => true,
        'data' => [
            'students' => $students
        ]
    ];
    error_log("Response data: " . print_r($response, true)); // Log dữ liệu response
    echo json_encode($response);

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