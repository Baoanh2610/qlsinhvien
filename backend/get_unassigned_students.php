<?php
require_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = getDBConnection();
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Lỗi kết nối database: " . $conn->connect_error]);
    exit();
}

// Lấy danh sách sinh viên chưa được gán vào bất kỳ ca học nào
$sql = "SELECT s.* 
        FROM students s 
        LEFT JOIN class_session_students css ON s.mssv = css.mssv 
        WHERE css.mssv IS NULL";
$result = $conn->query($sql);

$students = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }
}

echo json_encode(["success" => true, "students" => $students]);

$conn->close();
?>