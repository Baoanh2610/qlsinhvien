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

            if (response.data && response.data.success) {
                // Kiểm tra và đảm bảo dữ liệu là một mảng
                const sessionsData = Array.isArray(response.data.sessions)
                    ? response.data.sessions
                    : Object.values(response.data.sessions || {});

                console.log('Sessions data:', sessionsData);

                // Dữ liệu đã được format từ server, không cần format lại
                setSessions(sessionsData);
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

    return (
        <div className="class-sessions-container">
            <h2>Danh Sách Ca Học</h2>

            {loading ? (
                <div className="loading">Đang tải dữ liệu...</div>
            ) : sessions.length > 0 ? (
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
                            {sessions.map(session => (
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
                <div className="no-data">Không có ca học nào</div>
            )}
        </div>
    );
};

export default ClassSessions;