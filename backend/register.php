<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Xử lý yêu cầu OPTIONS (cho CORS)
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

// Kết nối database
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web-new";
$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed"]));
}

// Lấy dữ liệu từ React gửi lên
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["success" => false, "message" => "Không nhận được dữ liệu"]);
    exit;
}

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');

// Kiểm tra input hợp lệ
if (empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Thiếu email hoặc password"]);
    exit;
}

// Kiểm tra email đã tồn tại
$checkStmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$checkStmt->store_result(); // Lưu kết quả
if ($checkStmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email đã tồn tại"]);
    exit;
}
$checkStmt->close();

// Lưu tài khoản vào database
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);
$stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
$stmt->bind_param("ss", $email, $hashedPassword);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Đăng ký thành công"]);
} else {
    error_log("SQL Error: " . $stmt->error); // Debug lỗi SQL
    echo json_encode(["success" => false, "message" => "Lỗi khi đăng ký tài khoản"]);
}

$stmt->close();
$conn->close();
