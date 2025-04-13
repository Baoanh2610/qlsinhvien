<?php
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    if (!isset($_GET['mssv'])) {
        throw new Exception('Thiếu MSSV');
    }

    $mssv = $_GET['mssv'];

    // Truy vấn nhóm mà sinh viên thuộc về
    $sql = "SELECT sg.*, 
            COUNT(gm.mssv) as member_count,
            cs.date, cs.time_slot, cs.room
            FROM student_groups sg
            INNER JOIN group_members gm ON sg.id = gm.group_id
            INNER JOIN class_sessions cs ON sg.session_id = cs.id
            WHERE gm.mssv = ?
            GROUP BY sg.id";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $mssv);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();

        // Lấy danh sách thành viên trong nhóm
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

        $group = [
            'id' => $row['id'],
            'name' => $row['name'],
            'mode' => $row['mode'],
            'min_members' => $row['min_members'],
            'max_members' => $row['max_members'],
            'description' => $row['description'],
            'session_id' => $row['session_id'],
            'created_at' => $row['created_at'],
            'member_count' => $row['member_count'],
            'session' => [
                'date' => $row['date'],
                'time_slot' => $row['time_slot'],
                'room' => $row['room']
            ],
            'members' => $members
        ];

        echo json_encode([
            'success' => true,
            'group' => $group
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'group' => null,
            'message' => 'Sinh viên chưa thuộc nhóm nào'
        ]);
    }

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