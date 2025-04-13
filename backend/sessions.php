<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

require_once 'config.php';

// Kết nối database
$conn = new mysqli("localhost", "root", "", "web-new");
if ($conn->connect_error) {
    die(json_encode(['error' => 'Kết nối thất bại: ' . $conn->connect_error]));
}

// Lấy danh sách ca học
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT cs.*, u.name as teacher_name 
            FROM class_sessions cs 
            JOIN users u ON cs.teacher_id = u.id 
            ORDER BY cs.day_of_week, cs.start_time";
    $result = $conn->query($sql);

    $sessions = [];
    while ($row = $result->fetch_assoc()) {
        $sessions[] = $row;
    }

    echo json_encode($sessions);
}

// Thêm ca học mới
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $teacher_id = $data['teacher_id'];
    $class_name = $data['class_name'];
    $day_of_week = $data['day_of_week'];
    $start_time = $data['start_time'];
    $end_time = $data['end_time'];

    $sql = "INSERT INTO class_sessions (teacher_id, class_name, day_of_week, start_time, end_time) 
            VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("isiss", $teacher_id, $class_name, $day_of_week, $start_time, $end_time);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Thêm ca học thành công']);
    } else {
        echo json_encode(['error' => 'Thêm ca học thất bại: ' . $conn->error]);
    }

    $stmt->close();
}

// Đăng ký học bù
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    $student_id = $data['student_id'];
    $original_session_id = $data['original_session_id'];
    $make_up_session_id = $data['make_up_session_id'];
    $reason = $data['reason'];

    // Kiểm tra xem sinh viên có thuộc ca học gốc không
    $check_sql = "SELECT id FROM student_sessions 
                  WHERE student_id = ? AND session_id = ?";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bind_param("ii", $student_id, $original_session_id);
    $check_stmt->execute();
    $result = $check_stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['error' => 'Sinh viên không thuộc ca học này']);
        exit;
    }

    // Thêm yêu cầu học bù
    $sql = "INSERT INTO make_up_sessions (student_id, original_session_id, make_up_session_id, reason) 
            VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iiis", $student_id, $original_session_id, $make_up_session_id, $reason);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Đăng ký học bù thành công']);
    } else {
        echo json_encode(['error' => 'Đăng ký học bù thất bại: ' . $conn->error]);
    }

    $stmt->close();
    $check_stmt->close();
}

// Xử lý yêu cầu học bù (duyệt/từ chối)
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $data = json_decode(file_get_contents('php://input'), true);

    $make_up_id = $data['make_up_id'];
    $status = $data['status'];

    $sql = "UPDATE make_up_sessions SET status = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $status, $make_up_id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Cập nhật trạng thái thành công']);
    } else {
        echo json_encode(['error' => 'Cập nhật trạng thái thất bại: ' . $conn->error]);
    }

    $stmt->close();
}

$conn->close();
?>