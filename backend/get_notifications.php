<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'cors.php';
require_once 'config.php';

// Lấy kết nối MySQLi
$conn = getDBConnection();

$session_id = $_GET['session_id'] ?? null;
$student_mssv = $_GET['student_mssv'] ?? null;

if (!$session_id || !$student_mssv) {
    echo json_encode(['success' => false, 'message' => 'Thiếu session_id hoặc student_mssv']);
    closeDBConnection($conn);
    exit;
}

try {
    // Tìm group_id của sinh viên từ group_members
    $stmt = $conn->prepare("SELECT group_id FROM group_members WHERE mssv = ?");
    if (!$stmt) {
        handleError('Lỗi chuẩn bị truy vấn: ' . $conn->error);
    }

    $stmt->bind_param('s', $student_mssv);
    $stmt->execute();
    $result = $stmt->get_result();
    $group = $result->fetch_assoc();
    $group_id = $group ? $group['group_id'] : null;
    $stmt->close();

    // Lấy thông báo liên quan đến session_id và group_id (nếu có)
    $stmt = $conn->prepare("SELECT n.*, ns.is_read FROM notifications n LEFT JOIN notification_status ns ON n.id = ns.notification_id AND ns.student_id = ? WHERE n.session_id = ? AND (n.group_id = ? OR n.group_id IS NULL) ORDER BY n.created_at DESC");
    if (!$stmt) {
        handleError('Lỗi chuẩn bị truy vấn: ' . $conn->error);
    }

    // Nếu không có group_id, truyền giá trị mặc định (0) để tránh lỗi
    $default_group_id = $group_id ?? 0;
    $stmt->bind_param('sii', $student_mssv, $session_id, $default_group_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $notifications = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode(['success' => true, 'data' => $notifications]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()]);
}

closeDBConnection($conn);
?>