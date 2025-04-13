<?php
require_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$conn = getDBConnection();

if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Lỗi kết nối database: " . $conn->connect_error]);
    exit();
}

// Kiểm tra tham số
if (!isset($_GET['mssv']) || empty($_GET['mssv'])) {
    echo json_encode(["success" => false, "message" => "Thiếu tham số mssv"]);
    exit();
}

$mssv = $_GET['mssv'];

// Truy vấn
$sql = "SELECT * FROM students WHERE mssv = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $mssv);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $student = $result->fetch_assoc();
    echo json_encode(["success" => true, "student" => $student]);
} else {
    echo json_encode(["success" => false, "message" => "Không tìm thấy sinh viên"]);
}

$conn->close();
?>