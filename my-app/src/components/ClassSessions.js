import React, { useState, useEffect } from 'react';
import './ClassSessions.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const ClassSessions = () => {
    // Khởi tạo state là mảng rỗng
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Sử dụng useEffect để fetch dữ liệu
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/class-sessions`);
                console.log("Response data:", response.data);

                // Kiểm tra xem response.data.sessions có phải là mảng không
                if (response.data && response.data.success) {
                    if (Array.isArray(response.data.sessions)) {
                        setSessions(response.data.sessions);
                    } else {
                        // Nếu không phải mảng, chuyển đổi thành mảng
                        console.log("Sessions không phải mảng:", response.data.sessions);
                        setSessions([]);
                        setError("Dữ liệu không đúng định dạng");
                    }
                } else {
                    setSessions([]);
                    setError("Không nhận được dữ liệu hợp lệ");
                }
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu:", err);
                setSessions([]);
                setError("Lỗi khi tải dữ liệu");
                toast.error("Không thể tải danh sách ca học");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Hiển thị loading
    if (loading) {
        return <div>Đang tải...</div>;
    }

    // Hiển thị lỗi
    if (error) {
        return <div>{error}</div>;
    }

    // Kiểm tra nếu sessions là mảng rỗng
    if (!sessions || sessions.length === 0) {
        return <div>Không có ca học nào</div>;
    }

    // Hiển thị danh sách sessions
    return (
        <div className="class-sessions-container">
            <h2>Danh Sách Ca Học</h2>
            <div className="session-list">
                <table>
                    <thead>
                        <tr>
                            <th>Ngày</th>
                            <th>Ca học</th>
                            <th>Phòng học</th>
                            <th>Ngày tạo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((session, index) => (
                            <tr key={session.id || index}>
                                <td>{session.date}</td>
                                <td>{session.time_slot}</td>
                                <td>{session.room}</td>
                                <td>{session.created_at}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClassSessions;