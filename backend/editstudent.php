<?php
require_once 'config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST,GET, OPTIONS ");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$conn = getDBConnection();

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Lỗi kết nối CSDL"]));
}


// Đọc dữ liệu từ request
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Dữ liệu không hợp lệ!"]);
    exit();
}

// Lấy dữ liệu từ request
$mssv = $data["mssv"] ?? "";
$hoten = $data["hoten"] ?? "";
$lop = $data["lop"] ?? "";
$ngaysinh = $data["ngaysinh"] ?? "";
$khoa = $data["khoa"] ?? "";

// Kiểm tra dữ liệu đầu vào
if (empty($mssv) || empty($hoten) || empty($lop) || empty($ngaysinh) || empty($khoa)) {
    echo json_encode(["success" => false, "message" => "Thiếu dữ liệu!"]);
    exit();
}

// Cập nhật thông tin sinh viên
$sql = "UPDATE students SET hoten=?, lop=?, ngaysinh=?, khoa=? WHERE mssv=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssss", $hoten, $lop, $ngaysinh, $khoa, $mssv);
$result = $stmt->execute();

if ($result) {
    echo json_encode(["success" => true, "message" => "Cập nhật thành công"]);
} else {
    echo json_encode(["success" => false, "message" => "Lỗi khi cập nhật"]);
}

$stmt->close();
$conn->close();
?>