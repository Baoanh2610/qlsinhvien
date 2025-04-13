<?php
require_once 'config.php';

try {
    $conn = getDBConnection();

    // Lấy danh sách sinh viên
    $students_query = "SELECT mssv FROM students";
    $students_result = $conn->query($students_query);
    $students = [];
    while ($row = $students_result->fetch_assoc()) {
        $students[] = $row['mssv'];
    }

    // Lấy danh sách ca học
    $sessions_query = "SELECT id FROM class_sessions";
    $sessions_result = $conn->query($sessions_query);
    $sessions = [];
    while ($row = $sessions_result->fetch_assoc()) {
        $sessions[] = $row['id'];
    }

    // Thêm dữ liệu mẫu
    $stmt = $conn->prepare("INSERT IGNORE INTO session_enrollments (session_id, mssv) VALUES (?, ?)");

    foreach ($sessions as $session_id) {
        // Mỗi ca học sẽ có 5-10 sinh viên ngẫu nhiên
        $num_students = rand(5, 10);
        $selected_students = array_rand($students, min($num_students, count($students)));

        if (!is_array($selected_students)) {
            $selected_students = [$selected_students];
        }

        foreach ($selected_students as $student_index) {
            $mssv = $students[$student_index];
            $stmt->bind_param("is", $session_id, $mssv);
            $stmt->execute();
        }
    }

    echo "Đã thêm dữ liệu mẫu thành công";

} catch (Exception $e) {
    echo "Lỗi: " . $e->getMessage();
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
    if (isset($conn)) {
        closeDBConnection($conn);
    }
}
?>