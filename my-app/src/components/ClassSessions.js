import React, { useState, useEffect } from 'react';
import './ClassSessions.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const ClassSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    console.log("Sessions trước khi map:", sessions, Array.isArray(sessions));
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/class-sessions`);
                console.log('Response from backend:', response.data);

                if (response.data && response.data.success) {
                    setSessions(response.data.sessions || []);
                } else {
                    console.error('Dữ liệu ca học không hợp lệ:', response.data);
                    toast.error("Dữ liệu ca học không hợp lệ");
                }
            } catch (error) {
                console.error("Lỗi khi tải danh sách ca học:", error);
                toast.error("Không thể tải danh sách ca học");
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    if (loading) {
        return <div className="loading">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="class-sessions-container">
            <h2>Danh Sách Ca Học</h2>

            {sessions && sessions.length > 0 ? (
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
                        {sessions.map((session) => (
                            <tr key={session.id}>
                                <td>{session.date}</td>
                                <td>{session.time_slot}</td>
                                <td>{session.room}</td>
                                <td>{session.created_at}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="no-data">Không có ca học nào</div>
            )}
        </div>
    );
};

export default ClassSessions;