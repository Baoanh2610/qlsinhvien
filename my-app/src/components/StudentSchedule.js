import React, { useState, useEffect } from 'react';
import './StudentSchedule.css';
import { toast } from 'react-toastify';

const StudentSchedule = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));

    console.log('StudentSchedule component rendered');
    console.log('Initial user:', user);

    useEffect(() => {
        console.log('useEffect triggered');
        if (!user || !user.student || !user.student.mssv) {
            console.log('User or MSSV missing:', user);
            toast.error('Không tìm thấy thông tin sinh viên. Vui lòng đăng nhập lại.');
            return;
        }
        console.log('MSSV to fetch:', user.student.mssv);
        fetchStudentSessions();
    }, []);

    const fetchStudentSessions = async () => {
        setLoading(true);
        console.log('fetchStudentSessions started for MSSV:', user.student.mssv);
        try {
            const url = `${process.env.REACT_APP_API_URL}/get-student-sessions?mssv=${user.student.mssv}`;
            console.log('Fetching from:', url);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log('Raw API response:', data);
            if (data.success) {
                console.log('Sessions received:', data.sessions);
                setSessions(data.sessions || []);
                console.log('State updated with sessions:', data.sessions);
            } else {
                throw new Error(data.message || 'Không thể tải danh sách ca học');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            setSessions([]);
            toast.error('Không thể tải danh sách ca học: ' + error.message);
        } finally {
            setLoading(false);
            console.log('fetchStudentSessions completed');
        }
    };

    console.log('Current sessions state:', sessions);

    return (
        <div className="student-schedule-container">
            <h2>Ca Học Của Tôi</h2>

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : sessions.length > 0 ? (
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
                            {sessions.map(session => (
                                <tr key={session.id}>
                                    <td>{session.date}</td>
                                    <td>{session.time_slot}</td>
                                    <td>{session.room}</td>
                                    <td>{new Date(session.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>Bạn chưa được phân vào ca học nào.</p>
            )}
        </div>
    );
};

export default StudentSchedule;