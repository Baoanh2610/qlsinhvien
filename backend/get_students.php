<?php
require_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$conn = getDBConnection();
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Lỗi kết nối database: " . $conn->connect_error]);
    exit();
}

// Lấy toàn bộ danh sách sinh viên từ bảng students
$sql = "SELECT * FROM students";
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