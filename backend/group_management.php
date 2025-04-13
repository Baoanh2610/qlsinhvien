<?php
require_once 'cors.php';
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

$conn = getDBConnection();

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Kết nối database thất bại: ' . $conn->connect_error]));
}

// Lấy danh sách nhóm
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $session_id = isset($_GET['session_id']) ? $_GET['session_id'] : '';

    if (empty($session_id)) {
        die(json_encode(['success' => false, 'message' => 'Thiếu session_id']));
    }

    $sql = "SELECT g.*, 
            GROUP_CONCAT(s.hoten) as student_names,
            GROUP_CONCAT(s.mssv) as student_mssvs
            FROM student_groups g
            LEFT JOIN group_members gm ON g.id = gm.group_id
            LEFT JOIN students s ON gm.mssv = s.mssv
            WHERE g.session_id = ?
            GROUP BY g.id
            ORDER BY g.created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $session_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $groups = [];
    while ($row = $result->fetch_assoc()) {
        $groups[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'mode' => $row['mode'],
            'min_members' => $row['min_members'],
            'max_members' => $row['max_members'],
            'description' => $row['description'],
            'created_at' => $row['created_at'],
            'students' => $row['student_names'] ? explode(',', $row['student_names']) : [],
            'student_mssvs' => $row['student_mssvs'] ? explode(',', $row['student_mssvs']) : []
        ];
    }

    echo json_encode(['success' => true, 'groups' => $groups]);
}

// Tạo nhóm mới
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['name']) || !isset($data['mode']) || !isset($data['session_id'])) {
        die(json_encode(['success' => false, 'message' => 'Thiếu thông tin']));
    }

    $name = $data['name'];
    $mode = $data['mode'];
    $session_id = $data['session_id'];
    $min_members = $data['min_members'] ?? 1;
    $max_members = $data['max_members'] ?? 10;
    $description = $data['description'] ?? '';
    $created_at = date('Y-m-d H:i:s'); // Đảm bảo luôn có thời gian hiện tại

    // Bắt đầu transaction
    $conn->begin_transaction();

    try {
        // Thêm nhóm mới
        $sql = "INSERT INTO student_groups (name, mode, min_members, max_members, description, session_id, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssiisss", $name, $mode, $min_members, $max_members, $description, $session_id, $created_at);
        $stmt->execute();
        $group_id = $conn->insert_id;

        // Nếu có danh sách sinh viên được chọn
        if (isset($data['students']) && is_array($data['students'])) {
            $sql = "INSERT INTO group_members (group_id, mssv) VALUES (?, ?)";
            $stmt = $conn->prepare($sql);

            foreach ($data['students'] as $mssv) {
                $stmt->bind_param("is", $group_id, $mssv);
                $stmt->execute();
            }
        }

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Tạo nhóm thành công']);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Lỗi khi tạo nhóm: ' . $e->getMessage()]);
    }
}

// Cập nhật nhóm
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['id']) || !isset($data['students'])) {
        die(json_encode(['success' => false, 'message' => 'Thiếu thông tin']));
    }

    $group_id = $data['id'];
    $students = $data['students'];

    $conn->begin_transaction();

    try {
        // Xóa thành viên cũ
        $sql = "DELETE FROM group_members WHERE group_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $group_id);
        $stmt->execute();

        // Thêm thành viên mới
        $sql = "INSERT INTO group_members (group_id, mssv) VALUES (?, ?)";
        $stmt = $conn->prepare($sql);

        foreach ($students as $mssv) {
            $stmt->bind_param("is", $group_id, $mssv);
            $stmt->execute();
        }

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Cập nhật nhóm thành công']);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Lỗi khi cập nhật nhóm: ' . $e->getMessage()]);
    }
}

// Xóa nhóm
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $group_id = isset($_GET['id']) ? $_GET['id'] : '';

    if (empty($group_id)) {
        die(json_encode(['success' => false, 'message' => 'Thiếu ID nhóm']));
    }

    $conn->begin_transaction();

    try {
        // Xóa thành viên nhóm
        $sql = "DELETE FROM group_members WHERE group_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $group_id);
        $stmt->execute();

        // Xóa nhóm
        $sql = "DELETE FROM student_groups WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $group_id);
        $stmt->execute();

        $conn->commit();
        echo json_encode(['success' => true, 'message' => 'Xóa nhóm thành công']);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(['success' => false, 'message' => 'Lỗi khi xóa nhóm: ' . $e->getMessage()]);
    }
}

$conn->close();
?>