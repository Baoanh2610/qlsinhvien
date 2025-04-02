<?php
// Cấu hình database
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'web-new');

// Tạo kết nối
function getDBConnection()
{
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($conn->connect_error) {
        die("Kết nối thất bại: " . $conn->connect_error);
    }

    // Đặt charset là utf8
    $conn->set_charset("utf8");

    return $conn;
}

// Hàm đóng kết nối
function closeDBConnection($conn)
{
    if ($conn) {
        $conn->close();
    }
}

// Hàm xử lý lỗi
function handleError($message)
{
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit();
}

// Hàm xử lý thành công
function handleSuccess($data)
{
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
}
?>