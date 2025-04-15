import React, { useState, useEffect } from 'react';
import './ClassSessions.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const ClassSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/class-sessions`);
            console.log('Response from backend:', response.data);

            if (response.data && response.data.success && Array.isArray(response.data.sessions)) {
                // Format lại ngày tháng để hiển thị đúng
                const formattedSessions = response.data.sessions.map(session => ({
                    ...session,
                    date: new Date(session.date).toISOString().split('T')[0],
                    created_at: new Date(session.created_at).toLocaleString()
                }));

                setSessions(formattedSessions);
            } else {
                console.error('Dữ liệu ca học không hợp lệ:', response.data);
                setSessions([]);
                toast.error("Dữ liệu ca học không hợp lệ");
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách ca học:", error);
            toast.error("Không thể tải danh sách ca học");
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // Kiểm tra sessions có phải là mảng không
    const sessionsList = Array.isArray(sessions) ? sessions : [];

    return (
        <div className="class-sessions-container">
            <h2>Danh Sách Ca Học</h2>

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : sessionsList.length > 0 ? (
                <div className="sessions-list">
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
                            {sessionsList.map(session => (
                                <tr key={session.id}>
                                    <td>{session.date}</td>
                                    <td>{session.time_slot}</td>
                                    <td>{session.room}</td>
                                    <td>{session.created_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>Không có ca học nào</p>
            )}
        </div>
    );
};

export default ClassSessions;