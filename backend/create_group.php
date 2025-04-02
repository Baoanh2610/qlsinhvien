<?php
require_once 'cors.php';
require_once 'config.php';

header('Content-Type: application/json');

try {
    $conn = getDBConnection();

    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['session_id']) || !isset($data['mode'])) {
        throw new Exception('Thiếu thông tin bắt buộc');
    }

    $session_id = $data['session_id'];
    $mode = $data['mode'];
    $min_members = isset($data['min_members']) ? (int) $data['min_members'] : 2;
    $max_members = isset($data['max_members']) ? (int) $data['max_members'] : 5;
    $students = isset($data['students']) ? $data['students'] : [];

    if ($min_members > $max_members) {
        throw new Exception('Số thành viên tối thiểu không thể lớn hơn tối đa');
    }

    // Lấy tất cả sinh viên trong ca học
    $sql_students = "SELECT s.mssv 
                     FROM students s 
                     INNER JOIN class_session_students css ON s.mssv = css.mssv 
                     WHERE css.session_id = ?";
    $stmt_students = $conn->prepare($sql_students);
    $stmt_students->bind_param("i", $session_id);
    $stmt_students->execute();
    $result_students = $stmt_students->get_result();

    $all_students = [];
    while ($row = $result_students->fetch_assoc()) {
        $all_students[] = $row['mssv'];
    }

    if (empty($all_students)) {
        throw new Exception('Không có sinh viên nào trong ca học này');
    }

    // Xử lý chế độ ngẫu nhiên
    if ($mode === 'random') {
        // Xáo trộn danh sách sinh viên
        shuffle($all_students);
        $total_students = count($all_students);
        $remaining_students = $all_students;
        $group_index = 1;
        $created_groups = [];

        while (!empty($remaining_students)) {
            // Tính số thành viên cho nhóm hiện tại
            $members_count = rand($min_members, min($max_members, count($remaining_students)));
            if ($members_count > count($remaining_students)) {
                $members_count = count($remaining_students);
            }

            // Tạo nhóm mới
            $group_name = "Nhóm $group_index";
            $insert_group_sql = "INSERT INTO student_groups (name, mode, min_members, max_members, session_id) 
                                VALUES (?, ?, ?, ?, ?)";
            $insert_group_stmt = $conn->prepare($insert_group_sql);
            $insert_group_stmt->bind_param("ssiii", $group_name, $mode, $min_members, $max_members, $session_id);
            $insert_group_stmt->execute();
            $group_id = $conn->insert_id;

            // Lấy các sinh viên cho nhóm này
            $group_members = array_splice($remaining_students, 0, $members_count);

            // Thêm thành viên vào nhóm
            $insert_member_sql = "INSERT INTO group_members (group_id, mssv) VALUES (?, ?)";
            $insert_member_stmt = $conn->prepare($insert_member_sql);
            foreach ($group_members as $mssv) {
                $insert_member_stmt->bind_param("is", $group_id, $mssv);
                $insert_member_stmt->execute();
            }

            $created_groups[] = [
                'id' => $group_id,
                'name' => $group_name,
                'mode' => $mode,
                'min_members' => $min_members,
                'max_members' => $max_members
            ];
            $group_index++;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Tạo tất cả nhóm thành công',
            'groups' => $created_groups
        ]);
    } else if ($mode === 'teacher' || $mode === 'student') {
        if (empty($students)) {
            throw new Exception('Vui lòng cung cấp danh sách sinh viên cho chế độ này');
        }

        // Tạo một nhóm duy nhất
        $group_name = "Nhóm 1";
        $insert_group_sql = "INSERT INTO student_groups (name, mode, min_members, max_members, session_id) 
                            VALUES (?, ?, ?, ?, ?)";
        $insert_group_stmt = $conn->prepare($insert_group_sql);
        $insert_group_stmt->bind_param("ssiii", $group_name, $mode, $min_members, $max_members, $session_id);
        $insert_group_stmt->execute();
        $group_id = $conn->insert_id;

        // Thêm sinh viên vào nhóm
        $insert_member_sql = "INSERT INTO group_members (group_id, mssv) VALUES (?, ?)";
        $insert_member_stmt = $conn->prepare($insert_member_sql);
        foreach ($students as $mssv) {
            $insert_member_stmt->bind_param("is", $group_id, $mssv);
            $insert_member_stmt->execute();
        }

        echo json_encode([
            'success' => true,
            'message' => 'Tạo nhóm thành công',
            'group' => [
                'id' => $group_id,
                'name' => $group_name,
                'mode' => $mode,
                'min_members' => $min_members,
                'max_members' => $max_members
            ]
        ]);
    } else {
        throw new Exception('Chế độ không hợp lệ');
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