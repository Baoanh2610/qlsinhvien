<?php
require_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
session_start();

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$conn = getDBConnection();

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed"]));
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["success" => false, "message" => "Không nhận được dữ liệu"]);
    exit;
}

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$role = trim($data['role'] ?? '');

if (empty($email) || empty($password) || empty($role)) {
    echo json_encode(["success" => false, "message" => "Thiếu email, password hoặc role"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, email, password, role FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user["password"]) && $user["role"] === $role) {
        $_SESSION["user_id"] = $user["id"];
        $_SESSION["email"] = $user["email"];
        $_SESSION["role"] = $user["role"];

        // Lấy thông tin sinh viên nếu là student
        $student_info = null;
        if ($user["role"] === "student") {
            $stmt = $conn->prepare("SELECT mssv, hoten, khoa, lop, ngaysinh FROM students WHERE user_id = ?");
            $stmt->bind_param("i", $user["id"]);
            $stmt->execute();
            $student_result = $stmt->get_result();
            if ($student_result->num_rows > 0) {
                $student_info = $student_result->fetch_assoc();
            }
        }

        echo json_encode([
            "success" => true,
            "message" => "Đăng nhập thành công",
            "user" => [
                "id" => $user["id"],
                "email" => $user["email"],
                "role" => $user["role"],
                "student" => $student_info
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => $user["role"] === $role ? "Sai mật khẩu" : "Vai trò không khớp"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Tài khoản không tồn tại"]);
}

$stmt->close();
$conn->close();
?>