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
            console.log('🔥 Response full:', response.data);

            const rawSessions = response?.data?.sessions;
            console.log('📦 sessions trả về từ API:', rawSessions);

            if (response?.data?.success && Array.isArray(rawSessions)) {
                const formattedSessions = rawSessions.map(session => ({
                    ...session,
                    date: new Date(session.date).toISOString().split('T')[0],
                    created_at: new Date(session.created_at).toLocaleString()
                }));

                console.log('✅ formattedSessions:', formattedSessions);
                setSessions(formattedSessions);
            } else {
                console.error('❌ Dữ liệu ca học không hợp lệ:', response.data);
                toast.error("Dữ liệu ca học không hợp lệ");
                setSessions([]);
            }
        } catch (error) {
            console.error("💥 Lỗi khi tải danh sách ca học:", error);
            toast.error("Không thể tải danh sách ca học");
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const sessionsList = Array.isArray(sessions) ? sessions : [];
    console.log('🔍 sessions từ state:', sessions);
    console.log('🧪 sessionsList sau kiểm tra:', sessionsList);

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
