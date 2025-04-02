<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    if (!isset($_GET['session_id'])) {
        throw new Exception('Thiếu session_id');
    }

    $session_id = $_GET['session_id'];

    // Lấy danh sách nhóm và số lượng thành viên
    $sql = "SELECT sg.*, 
            COUNT(gm.mssv) as member_count
            FROM student_groups sg
            LEFT JOIN group_members gm ON sg.id = gm.group_id
            WHERE sg.session_id = ?
            GROUP BY sg.id
            ORDER BY sg.created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $session_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $groups = [];
    while ($row = $result->fetch_assoc()) {
        // Lấy danh sách thành viên của nhóm
        $members_sql = "SELECT s.* 
                       FROM students s 
                       INNER JOIN group_members gm ON s.mssv = gm.mssv 
                       WHERE gm.group_id = ?";
        $members_stmt = $conn->prepare($members_sql);
        $members_stmt->bind_param("i", $row['id']);
        $members_stmt->execute();
        $members_result = $members_stmt->get_result();

        $members = [];
        while ($member = $members_result->fetch_assoc()) {
            $members[] = [
                'mssv' => $member['mssv'],
                'hoten' => $member['hoten'],
                'khoa' => $member['khoa'],
                'lop' => $member['lop']
            ];
        }

        $groups[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'mode' => $row['mode'],
            'min_members' => $row['min_members'],
            'max_members' => $row['max_members'],
            'description' => $row['description'],
            'session_id' => $row['session_id'],
            'created_at' => $row['created_at'],
            'member_count' => $row['member_count'],
            'members' => $members
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'groups' => $groups
        ]
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
}
?>