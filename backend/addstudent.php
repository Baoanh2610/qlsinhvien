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

// Lấy dữ liệu từ React gửi lên
$data = json_decode(file_get_contents("php://input"), true);

// Ghi log để debug dữ liệu nhận được
file_put_contents("debug.txt", json_encode($data, JSON_PRETTY_PRINT));

if (!$data) {
    echo json_encode(["success" => false, "message" => "Không nhận được dữ liệu từ React"]);
    exit();
}

// Lấy thông tin sinh viên từ dữ liệu gửi lên
$mssv = trim($data['mssv'] ?? '');
$hoTen = trim($data['hoTen'] ?? '');
$khoa = trim($data['khoa'] ?? '');
$lop = trim($data['lop'] ?? '');
$ngaySinh = trim($data['ngaySinh'] ?? '');

// Kiểm tra input hợp lệ
if (empty($mssv) || empty($hoTen) || empty($khoa) || empty($lop) || empty($ngaySinh)) {
    echo json_encode(["success" => false, "message" => "Vui lòng điền đầy đủ thông tin"]);
    exit();
}

// Kiểm tra MSSV đã tồn tại chưa
$checkStmt = $conn->prepare("SELECT id FROM students WHERE mssv = ?");
$checkStmt->bind_param("s", $mssv);
$checkStmt->execute();
$checkStmt->store_result();
if ($checkStmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "MSSV đã tồn tại"]);
    $checkStmt->close();
    exit();
}
$checkStmt->close();

// Thêm sinh viên vào database
$stmt = $conn->prepare("INSERT INTO students (mssv, hoten, khoa, lop, ngaysinh) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $mssv, $hoTen, $khoa, $lop, $ngaySinh);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Thêm sinh viên thành công"]);
} else {
    echo json_encode(["success" => false, "message" => "Lỗi SQL: " . $stmt->error]);
}

$stmt->close();
$conn->close();