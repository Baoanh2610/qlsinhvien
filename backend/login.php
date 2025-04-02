<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
session_start();

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

// Kiểm tra tài khoản trong database
$stmt = $conn->prepare("SELECT id, email, password FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user["password"])) {
        $_SESSION["user_id"] = $user["id"];
        $_SESSION["email"] = $user["email"];
        echo json_encode(["success" => true, "message" => "Đăng nhập thành công", "user" => ["id" => $user["id"], "email" => $user["email"]]]);
    } else {
        echo json_encode(["success" => false, "message" => "Sai mật khẩu"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Tài khoản không tồn tại"]);
}

$stmt->close();
$conn->close();
