<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Max-Age: 3600');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');

// Kết nối database
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web-new";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Lỗi kết nối database: " . $conn->connect_error]);
    exit();
}

// Xử lý các request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Lấy danh sách ca học và sinh viên
    $sql = "SELECT cs.*, 
            GROUP_CONCAT(s.hoten) as student_names,
            GROUP_CONCAT(s.mssv) as student_mssvs
            FROM class_sessions cs
            LEFT JOIN class_session_students css ON cs.id = css.session_id
            LEFT JOIN students s ON css.mssv = s.mssv
            GROUP BY cs.id
            ORDER BY cs.date DESC, cs.time_slot";
    $result = $conn->query($sql);

    $sessions = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $sessions[] = [
                'id' => $row['id'],
                'date' => $row['date'],
                'time_slot' => $row['time_slot'],
                'room' => $row['room'],
                'created_at' => $row['created_at'],
                'students' => $row['student_names'] ? explode(',', $row['student_names']) : [],
                'student_mssvs' => $row['student_mssvs'] ? explode(',', $row['student_mssvs']) : []
            ];
        }
    }

    echo json_encode($sessions);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Thêm ca học mới
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data) {
        echo json_encode(["success" => false, "message" => "Dữ liệu không hợp lệ"]);
        exit();
    }

    $date = $data['date'];
    $time_slot = $data['time_slot'];
    $room = $data['room'];
    $students = $data['students'];

    // Bắt đầu transaction
    $conn->begin_transaction();

    try {
        // Thêm ca học vào database
        $sql = "INSERT INTO class_sessions (date, time_slot, room) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $date, $time_slot, $room);
        $stmt->execute();
        $session_id = $conn->insert_id;

        // Thêm sinh viên vào ca học
        if (!empty($students)) {
            $sql = "INSERT INTO class_session_students (session_id, mssv) VALUES (?, ?)";
            $stmt = $conn->prepare($sql);

            foreach ($students as $mssv) {
                $stmt->bind_param("is", $session_id, $mssv);
                $stmt->execute();
            }
        }

        $conn->commit();
        echo json_encode(["success" => true, "message" => "Thêm ca học thành công"]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Lỗi khi thêm ca học: " . $e->getMessage()]);
    }

    $stmt->close();
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Xóa ca học
    $id = $_GET['id'];

    // Bắt đầu transaction
    $conn->begin_transaction();

    try {
        // Xóa sinh viên trong ca học trước
        $sql = "DELETE FROM class_session_students WHERE session_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();

        // Xóa ca học
        $sql = "DELETE FROM class_sessions WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();

        $conn->commit();
        echo json_encode(["success" => true, "message" => "Xóa ca học thành công"]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Lỗi khi xóa ca học: " . $e->getMessage()]);
    }

    $stmt->close();
}

$conn->close();
?>