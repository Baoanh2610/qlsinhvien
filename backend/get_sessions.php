<?php
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
header('Access-Control-Max-Age: 3600');

try {
    $conn = getDBConnection();

    // Lấy danh sách ca học
    $sql = "SELECT * FROM class_sessions ORDER BY date, time_slot";
    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception('Lỗi khi truy vấn: ' . $conn->error);
    }

    $sessions = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $sessions[] = [
                'id' => $row['id'],
                'date' => $row['date'],
                'time_slot' => $row['time_slot'],
                'room' => $row['room'],
                'created_at' => $row['created_at']
            ];
        }
    }

    handleSuccess(['sessions' => $sessions]);

} catch (Exception $e) {
    handleError($e->getMessage());
} finally {
    if (isset($conn)) {
        closeDBConnection($conn);
    }
}
?>