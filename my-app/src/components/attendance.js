import React, { useState, useEffect } from 'react';
import './attendance.css';
import { toast } from 'react-toastify';

const Attendance = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [error, setError] = useState(null);

    // Cập nhật thời gian hiện tại mỗi giây
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        if (selectedSession) {
            fetchStudentsBySession();
            fetchAttendance();
        }
    }, [selectedSession]);

    const fetchSessions = async () => {
        try {
            const response = await fetch('http://localhost/Home_React_baoanh/backend/get_sessions.php');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data.success) {
                setSessions(data.data.sessions);
            } else {
                toast.error(data.message || 'Không thể tải danh sách ca học');
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error('Không thể tải danh sách ca học');
        }
    };

    const fetchStudentsBySession = async () => {
        try {
            const response = await fetch(`http://localhost/Home_React_baoanh/backend/get_students_by_session.php?session_id=${selectedSession}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            if (data.success) {
                setStudents(data.data.students);
            } else {
                toast.error(data.message || 'Không thể tải danh sách sinh viên');
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Không thể tải danh sách sinh viên');
        }
    };

    const fetchAttendance = async () => {
        try {
            if (!selectedSession) {
                setError('Vui lòng chọn một ca học');
                setAttendance([]);
                return;
            }

            console.log('Fetching attendance for session:', selectedSession);
            const url = `${process.env.REACT_APP_API_URL}/get_attendance.php?session_id=${selectedSession}`;
            console.log('URL:', url);

            const response = await fetch(url);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (!data.success) {
                throw new Error(data.message || 'Lỗi khi lấy dữ liệu điểm danh');
            }

            if (!data.data || !Array.isArray(data.data.attendance)) {
                console.error('Invalid data format:', data);
                throw new Error('Dữ liệu không hợp lệ');
            }

            console.log('Setting attendance:', data.data.attendance);
            setAttendance(data.data.attendance);
            setError(null);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            setError(error.message || 'Lỗi khi lấy dữ liệu điểm danh');
            setAttendance([]);
        }
    };

    const handleAttendanceUpdate = async (mssv, status) => {
        setLoading(true);
        try {
            console.log('Updating attendance:', { session_id: selectedSession, mssv, status });
            const response = await fetch(`${process.env.REACT_APP_API_URL}/attendance.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: selectedSession,
                    mssv: mssv,
                    status: status
                })
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                // Cập nhật lại danh sách điểm danh
                await fetchAttendance();
                toast.success('Cập nhật điểm danh thành công');
            } else {
                toast.error(data.message || 'Không thể cập nhật điểm danh');
            }
        } catch (error) {
            console.error('Error updating attendance:', error);
            toast.error('Không thể cập nhật điểm danh');
        }
        setLoading(false);
    };

    const filteredStudents = students.filter(student =>
        student.mssv.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.hoten.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="attendance-container">
            <h2>Điểm danh</h2>

            <div className="session-selector">
                <label>Chọn ca học:</label>
                <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                >
                    <option value="">Chọn ca học</option>
                    {sessions.map(session => (
                        <option key={session.id} value={session.id}>
                            {session.date} - {session.time_slot} - {session.room}
                        </option>
                    ))}
                </select>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {selectedSession && !error && (
                <div className="attendance-list">
                    <table>
                        <thead>
                            <tr>
                                <th>MSSV</th>
                                <th>Họ tên</th>
                                <th>Trạng thái</th>
                                <th>Thời gian</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(attendance) && attendance.length > 0 ? (
                                attendance.map((student) => (
                                    <tr key={student.mssv}>
                                        <td>{student.mssv}</td>
                                        <td>{student.hoten}</td>
                                        <td>{student.status}</td>
                                        <td>{student.time || 'Chưa điểm danh'}</td>
                                        <td>
                                            <button
                                                onClick={() => handleAttendanceUpdate(student.mssv, 'present')}
                                                className={student.status === 'present' ? 'active' : ''}
                                            >
                                                Có mặt
                                            </button>
                                            <button
                                                onClick={() => handleAttendanceUpdate(student.mssv, 'absent')}
                                                className={student.status === 'absent' ? 'active' : ''}
                                            >
                                                Vắng mặt
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center' }}>
                                        Không có sinh viên nào trong danh sách
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Attendance;