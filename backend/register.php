<?php
require_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$conn = getDBConnection();

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]));
}

$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    echo json_encode(["success" => false, "message" => "Không nhận được dữ liệu"]);
    exit;
}

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$role = trim($data['role'] ?? '');
$mssv = trim($data['mssv'] ?? '');
$hoten = trim($data['hoten'] ?? '');
$khoa = trim($data['khoa'] ?? '');
$lop = trim($data['lop'] ?? '');
$ngaysinh = trim($data['ngaysinh'] ?? '');

// Debug: Ghi log dữ liệu nhận được
error_log("Data received: " . json_encode($data));

if (empty($email) || empty($password) || empty($role)) {
    echo json_encode(["success" => false, "message" => "Thiếu email, password hoặc role"]);
    exit;
}

if ($role === "student" && (empty($mssv) || empty($hoten) || empty($khoa) || empty($lop) || empty($ngaysinh))) {
    echo json_encode(["success" => false, "message" => "Thiếu thông tin sinh viên"]);
    exit;
}

// Kiểm tra email đã tồn tại trong users
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email đã tồn tại"]);
    exit;
}

// Kiểm tra mssv đã tồn tại trong students (nếu là student)
if ($role === "student") {
    $stmt = $conn->prepare("SELECT id FROM students WHERE mssv = ?");
    $stmt->bind_param("s", $mssv);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "MSSV đã tồn tại"]);
        exit;
    }
}

// Mã hóa mật khẩu
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Thêm tài khoản vào users
$stmt = $conn->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $email, $hashed_password, $role);
if ($stmt->execute()) {
    $user_id = $conn->insert_id; // Lấy ID của user vừa tạo

    // Nếu là student, thêm thông tin vào students
    if ($role === "student") {
        $stmt = $conn->prepare("INSERT INTO students (mssv, hoten, khoa, lop, ngaysinh, user_id) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssi", $mssv, $hoten, $khoa, $lop, $ngaysinh, $user_id);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Đăng ký thành công"]);
        } else {
            error_log("Error inserting into students: " . $stmt->error);
            $conn->query("DELETE FROM users WHERE id = $user_id");
            echo json_encode(["success" => false, "message" => "Lỗi khi tạo thông tin sinh viên: " . $stmt->error]);
            exit;
        }
    } else {
        echo json_encode(["success" => true, "message" => "Đăng ký thành công"]);
    }
} else {
    error_log("Error inserting into users: " . $stmt->error);
    echo json_encode(["success" => false, "message" => "Lỗi khi đăng ký tài khoản: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>