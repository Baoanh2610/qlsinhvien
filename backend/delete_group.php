<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    if (!isset($_GET['group_id'])) {
        throw new Exception('Thiếu group_id');
    }

    $group_id = $_GET['group_id'];

    // Kiểm tra nhóm có tồn tại
    $check_group = $conn->query("SELECT id FROM student_groups WHERE id = $group_id");
    if ($check_group->num_rows === 0) {
        throw new Exception('Nhóm không tồn tại');
    }

    // Xóa tất cả thành viên của nhóm
    $delete_members = $conn->prepare("DELETE FROM group_members WHERE group_id = ?");
    $delete_members->bind_param("i", $group_id);
    $delete_members->execute();

    // Xóa nhóm
    $delete_group = $conn->prepare("DELETE FROM student_groups WHERE id = ?");
    $delete_group->bind_param("i", $group_id);
    $delete_group->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Xóa nhóm thành công'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}