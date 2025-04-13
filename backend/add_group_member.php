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

    // Kiểm tra nhóm có tồn tại và chưa đạt số lượng tối đa
    $check_group = $conn->query("SELECT max_members FROM student_groups WHERE id = $group_id");
    if ($check_group->num_rows === 0) {
        throw new Exception('Nhóm không tồn tại');
    }

    $group = $check_group->fetch_assoc();

    // Đếm số lượng thành viên hiện tại
    $count_members = $conn->query("SELECT COUNT(*) as count FROM group_members WHERE group_id = $group_id");
    $current_count = $count_members->fetch_assoc()['count'];

    if ($current_count >= $group['max_members']) {
        throw new Exception('Nhóm đã đạt số lượng thành viên tối đa');
    }

    // Kiểm tra sinh viên đã có trong nhóm chưa
    $check_member = $conn->query("SELECT id FROM group_members WHERE group_id = $group_id AND student_id = $student_id");
    if ($check_member->num_rows > 0) {
        throw new Exception('Sinh viên đã có trong nhóm');
    }

    // Thêm sinh viên vào nhóm
    $sql = "INSERT INTO group_members (group_id, student_id) VALUES (?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ii", $group_id, $student_id);
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Thêm thành viên thành công'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}