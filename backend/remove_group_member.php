<?php
require_once 'config.php';
require_once 'cors.php';

header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['group_id']) || !isset($data['student_id'])) {
        throw new Exception('Thiếu thông tin bắt buộc');
    }

    $group_id = $data['group_id'];
    $student_id = $data['student_id'];

    // Kiểm tra nhóm có tồn tại
    $check_group = $conn->query("SELECT id FROM student_groups WHERE id = $group_id");
    if ($check_group->num_rows === 0) {
        throw new Exception('Nhóm không tồn tại');
    }

    // Kiểm tra sinh viên có trong nhóm không
    $check_member = $conn->query("SELECT id FROM group_members WHERE group_id = $group_id AND student_id = $student_id");
    if ($check_member->num_rows === 0) {
        throw new Exception('Sinh viên không có trong nhóm');
    }

    // Xóa sinh viên khỏi nhóm
    $sql = "DELETE FROM group_members WHERE group_id = ? AND student_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $group_id, $student_id);
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Xóa thành viên thành công'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}