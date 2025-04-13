import React, { useState, useEffect } from 'react';
import './StudentNotifications.css';
import { toast } from 'react-toastify';

const StudentNotifications = ({ sessionId, studentMssv }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `http://localhost/Home_React_baoanh/backend/get_notifications.php?session_id=${sessionId}&student_mssv=${studentMssv}`
            );
            const data = await response.json();
            if (data.success) {
                setNotifications(data.data);
                // Hiển thị toast cho thông báo chưa đọc
                data.data.forEach(notification => {
                    if (!notification.is_read) {
                        toast.info(`Thông báo mới: ${notification.message}`);
                    }
                });
            } else {
                toast.error(data.message || 'Không thể tải thông báo');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Không thể tải thông báo');
        }
        setLoading(false);
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch('http://localhost/Home_React_baoanh/backend/mark_notification_read.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    notification_id: notificationId,
                    student_mssv: studentMssv,
                }),
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificationId ? { ...notif, is_read: true } : notif
                    )
                );
            } else {
                toast.error(data.message || 'Không thể đánh dấu đã đọc');
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Không thể đánh dấu đã đọc');
        }
    };

    useEffect(() => {
        if (sessionId && studentMssv) {
            fetchNotifications();
        }
    }, [sessionId, studentMssv]);

    return (
        <div className="student-notifications">
            <h2>Thông Báo</h2>
            {loading ? (
                <p>Đang tải...</p>
            ) : notifications.length === 0 ? (
                <p>Không có thông báo nào</p>
            ) : (
                <ul className="notification-list">
                    {notifications.map(notification => (
                        <li
                            key={notification.id}
                            className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                            <p>{notification.message}</p>
                            <span className="timestamp">
                                {new Date(notification.created_at).toLocaleString()}
                            </span>
                            <span className="status">
                                {notification.is_read ? 'Đã đọc' : 'Chưa đọc'}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default StudentNotifications;