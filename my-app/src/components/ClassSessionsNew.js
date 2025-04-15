// Đổi tên thành ClassSessionsNew.js
import React, { useState, useEffect } from 'react';
import './ClassSessions.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const ClassSessionsNew = () => {
    const [sessions, setSessions] = useState({});
    const [loading, setLoading] = useState(false);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/class-sessions`);
            console.log('Response from backend:', response.data);

            if (response.data && response.data.success) {
                const sessionsData = response.data.sessions;
                console.log('Sessions data:', sessionsData);

                // Format lại ngày tháng cho từng session
                const formattedSessions = {};
                Object.keys(sessionsData).forEach(key => {
                    const session = sessionsData[key];
                    formattedSessions[key] = {
                        ...session,
                        date: new Date(session.date).toISOString().split('T')[0],
                        created_at: new Date(session.created_at).toLocaleString()
                    };
                });

                setSessions(formattedSessions);
            } else {
                console.error('Dữ liệu ca học không hợp lệ:', response.data);
                setSessions({});
                toast.error("Dữ liệu ca học không hợp lệ");
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách ca học:", error);
            toast.error("Không thể tải danh sách ca học");
            setSessions({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // Lấy danh sách các session để render
    const sessionList = Object.values(sessions);

    return (
        <div className="class-sessions-container">
            <h2>Danh Sách Ca Học</h2>

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : sessionList.length > 0 ? (
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
                            {sessionList.map(session => (
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

export default ClassSessionsNew;