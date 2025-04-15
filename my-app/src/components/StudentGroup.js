// src/components/StudentGroup.js
import React, { useState, useEffect, useRef } from 'react';
import './StudentGroup.css';
import { toast } from 'react-toastify';

const StudentGroup = () => {
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const bellRef = useRef(null); // Ref cho chuông
    const dropdownRef = useRef(null); // Ref cho dropdown

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            toast.error('Vui lòng đăng nhập để xem thông tin nhóm.');
            return;
        }

        try {
            const user = JSON.parse(userData);
            if (!user?.student?.mssv) {
                toast.error('Không tìm thấy thông tin sinh viên. Vui lòng đăng nhập lại.');
                return;
            }
            console.log('User MSSV:', user.student.mssv);
            fetchStudentGroup(user.student.mssv);
        } catch (error) {
            console.error('Lỗi khi phân tích dữ liệu người dùng:', error);
            toast.error('Dữ liệu người dùng không hợp lệ. Vui lòng đăng nhập lại.');
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                bellRef.current &&
                !bellRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowNotifications(false); // Đóng dropdown nếu nhấp ngoài
            }
        };

        // Thêm sự kiện click vào document
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // Dọn dẹp sự kiện khi component unmount
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchStudentGroup = async (mssv) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/get-student-group?mssv=${mssv}`,
                {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                }
            );
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            console.log('API get-student-group response:', data);
            if (data.success && data.group) {
                console.log('Group session ID:', data.group.session_id);
                setGroup(data.group);
                fetchNotifications(data.group.session_id, mssv);
            } else {
                setGroup(null);
                toast.info('Bạn chưa thuộc nhóm nào.');
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin nhóm:', error);
            setGroup(null);
            toast.error('Không thể tải thông tin nhóm');
        }
        setLoading(false);
    };

    const fetchNotifications = async (sessionId, studentMssv) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/get-notifications?session_id=${sessionId}&student_mssv=${studentMssv}`
            );
            const data = await response.json();
            console.log('Notifications API response:', data);
            if (data.success) {
                setNotifications(data.data);
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
    };

    const markAsRead = async (notificationId) => {
        const user = JSON.parse(localStorage.getItem('user'));
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/mark-notification-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    notification_id: notificationId,
                    student_mssv: user.student.mssv,
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

    const formatDate = (dateString) => {
        if (!dateString || dateString === '0000-00-00 00:00:00') {
            return 'Chưa xác định';
        }
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Ngày không hợp lệ' : date.toLocaleString();
    };

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    return (
        <div className="student-group-container">
            <h2>Nhóm Của Tôi</h2>

            {/* Biểu tượng chuông */}
            <div className="notification-bell" ref={bellRef} onClick={toggleNotifications}>
                🔔
                {notifications.some(n => !n.is_read) && (
                    <span className="notification-count">1</span>
                )}
            </div>

            {/* Dropdown thông báo */}
            {showNotifications && (
                <div className="notification-dropdown" ref={dropdownRef}>
                    <h3>Thông Báo</h3>
                    {notifications.length === 0 ? (
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
            )}

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : group ? (
                <div className="group-details">
                    <div className="group-header">
                        <h3>{group.name}</h3>
                        <p>
                            Chế độ:{' '}
                            {group.mode === 'random'
                                ? 'Ngẫu Nhiên'
                                : group.mode === 'teacher'
                                    ? 'Giáo Viên Chỉ Định'
                                    : 'Sinh Viên Tự Chọn'}
                        </p>
                        <p>
                            Ca học:{' '}
                            {group.session
                                ? `${group.session.date} - ${group.session.time_slot} - ${group.session.room}`
                                : 'Chưa có thông tin ca học'}
                        </p>
                        <p>Số thành viên: {group.member_count}</p>
                        <p>Ngày tạo: {formatDate(group.created_at)}</p>
                    </div>
                    <div className="group-members">
                        <h4>Danh Sách Thành Viên:</h4>
                        {group.members.length > 0 ? (
                            <ul>
                                {group.members.map((member, index) => (
                                    <li key={index}>
                                        {member.hoten} ({member.mssv})
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Chưa có thành viên trong nhóm</p>
                        )}
                    </div>
                </div>
            ) : (
                <p>Bạn chưa thuộc nhóm nào.</p>
            )}
        </div>
    );
};

export default StudentGroup;