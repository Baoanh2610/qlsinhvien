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

    $sql = "SELECT mssv, hoten, khoa, lop, ngaysinh, email 
            FROM students 
            WHERE mssv = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $mssv);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('Không tìm thấy sinh viên');
    }

    $student = $result->fetch_assoc();

    echo json_encode([
        'success' => true,
        'data' => [
            'student' => $student,
            'role' => 'student' // Giả định role là student
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