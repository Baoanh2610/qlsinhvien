<?php
require_once 'config.php';

try {
    $conn = getDBConnection();

    // Tạo bảng session_enrollments
    $sql = "CREATE TABLE IF NOT EXISTS session_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        mssv VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES class_sessions(id),
        FOREIGN KEY (mssv) REFERENCES students(mssv),
        UNIQUE KEY unique_enrollment (session_id, mssv)
    )";

    if ($conn->query($sql) === TRUE) {
        echo "Bảng session_enrollments đã được tạo thành công";
    } else {
        throw new Exception("Lỗi khi tạo bảng: " . $conn->error);
    }

} catch (Exception $e) {
    echo "Lỗi: " . $e->getMessage();
} finally {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
}
?>