<?php
// Cấu hình database
define('DB_HOST', getenv('DB_HOST') ?: 'your_database_host');
define('DB_USER', getenv('DB_USER') ?: 'your_database_user');
define('DB_PASS', getenv('DB_PASS') ?: 'your_database_password');
define('DB_NAME', getenv('DB_NAME') ?: 'your_database_name');

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