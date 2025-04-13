<?php
require_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Xử lý yêu cầu OPTIONS (CORS)
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$conn = getDBConnection();
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Lỗi kết nối database: " . $conn->connect_error]);
    exit();
}

// Nhận dữ liệu từ React
$data = json_decode(file_get_contents("php://input"), true);
$mssv = $data["mssv"] ?? "";

// Kiểm tra nếu MSSV trống
if (empty($mssv)) {
    echo json_encode(["success" => false, "message" => "MSSV không hợp lệ"]);
    exit();
}

// Xóa sinh viên theo MSSV
$stmt = $conn->prepare("DELETE FROM students WHERE mssv = ?");
$stmt->bind_param("s", $mssv);
if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Xóa sinh viên thành công"]);
} else {
    echo json_encode(["success" => false, "message" => "Lỗi khi xóa sinh viên"]);
}

$stmt->close();
$conn->close();
