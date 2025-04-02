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

// Lấy danh sách yêu cầu học bù
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT 
                m.*,
                s.name as student_name,
                cs1.class_name as original_session_name,
                cs2.class_name as make_up_session_name
            FROM make_up_sessions m
            JOIN students s ON m.student_id = s.id
            JOIN class_sessions cs1 ON m.original_session_id = cs1.id
            JOIN class_sessions cs2 ON m.make_up_session_id = cs2.id
            ORDER BY m.created_at DESC";

    $result = $conn->query($sql);

    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = $row;
    }

    echo json_encode($requests);
}

// Thêm yêu cầu học bù mới
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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

    // Kiểm tra xem đã có yêu cầu học bù cho ca học này chưa
    $check_duplicate_sql = "SELECT id FROM make_up_sessions 
                           WHERE student_id = ? AND original_session_id = ? AND status = 'pending'";
    $check_duplicate_stmt = $conn->prepare($check_duplicate_sql);
    $check_duplicate_stmt->bind_param("ii", $student_id, $original_session_id);
    $check_duplicate_stmt->execute();
    $duplicate_result = $check_duplicate_stmt->get_result();

    if ($duplicate_result->num_rows > 0) {
        echo json_encode(['error' => 'Đã có yêu cầu học bù cho ca học này']);
        exit;
    }

    // Thêm yêu cầu học bù
    $sql = "INSERT INTO make_up_sessions (student_id, original_session_id, make_up_session_id, reason) 
            VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("iiis", $student_id, $original_session_id, $make_up_session_id, $reason);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Thêm yêu cầu học bù thành công']);
    } else {
        echo json_encode(['error' => 'Thêm yêu cầu học bù thất bại: ' . $conn->error]);
    }

    $stmt->close();
    $check_stmt->close();
    $check_duplicate_stmt->close();
}

// Cập nhật trạng thái yêu cầu học bù
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $data = json_decode(file_get_contents('php://input'), true);

    $make_up_id = $data['make_up_id'];
    $status = $data['status'];

    // Nếu yêu cầu được duyệt, cập nhật điểm danh
    if ($status === 'approved') {
        $conn->begin_transaction();

        try {
            // Lấy thông tin yêu cầu học bù
            $get_request_sql = "SELECT * FROM make_up_sessions WHERE id = ?";
            $get_request_stmt = $conn->prepare($get_request_sql);
            $get_request_stmt->bind_param("i", $make_up_id);
            $get_request_stmt->execute();
            $request = $get_request_stmt->get_result()->fetch_assoc();

            // Cập nhật điểm danh cho ca học bù
            $update_attendance_sql = "INSERT INTO attendance (mssv, status, date, session_id) 
                                    SELECT s.mssv, 'present', CURDATE(), ? 
                                    FROM students s 
                                    WHERE s.id = ?";
            $update_attendance_stmt = $conn->prepare($update_attendance_sql);
            $update_attendance_stmt->bind_param("ii", $request['make_up_session_id'], $request['student_id']);
            $update_attendance_stmt->execute();

            // Cập nhật trạng thái yêu cầu
            $update_status_sql = "UPDATE make_up_sessions SET status = ? WHERE id = ?";
            $update_status_stmt = $conn->prepare($update_status_sql);
            $update_status_stmt->bind_param("si", $status, $make_up_id);
            $update_status_stmt->execute();

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Duyệt yêu cầu học bù thành công']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['error' => 'Có lỗi xảy ra: ' . $e->getMessage()]);
        }
    } else {
        // Nếu từ chối, chỉ cập nhật trạng thái
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
}

$conn->close();
?>