import React, { useState, useEffect } from 'react';
import './ClassSessions.css';
import { toast } from 'react-hot-toast';

const ClassSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [students, setStudents] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [formData, setFormData] = useState({
        date: '',
        time_slot: '',
        room: ''
    });

    // Fetch danh sách ca học và sinh viên
    useEffect(() => {
        fetchSessions();
        fetchStudents();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/get_sessions.php`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setSessions(data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error('Không thể tải danh sách ca học');
            setSessions([]);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await fetch('http://localhost/Home_React_baoanh/backend/get_students.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            console.log('Dữ liệu sinh viên:', data);

            if (data.success && Array.isArray(data.students)) {
                setStudents(data.students);
            } else {
                console.error('Dữ liệu sinh viên không đúng định dạng:', data);
                setStudents([]);
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sinh viên:', error);
            setStudents([]);
        }
    };

    const handleAddSession = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost/Home_React_baoanh/backend/class_sessions.php', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: formData.date,
                    time_slot: formData.time_slot,
                    room: formData.room,
                    students: selectedStudents
                }),
            });
            const data = await response.json();
            if (data.success) {
                setShowAddForm(false);
                setFormData({ date: '', time_slot: '', room: '' });
                setSelectedStudents([]);
                fetchSessions();
            } else {
                console.error('Lỗi khi thêm ca học:', data.message);
            }
        } catch (error) {
            console.error('Lỗi khi thêm ca học:', error);
        }
    };

    const handleDeleteSession = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa ca học này?')) {
            try {
                const response = await fetch(`http://localhost/Home_React_baoanh/backend/class_sessions.php?id=${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                const data = await response.json();
                if (data.success) {
                    fetchSessions();
                } else {
                    console.error('Lỗi khi xóa ca học:', data.message);
                }
            } catch (error) {
                console.error('Lỗi khi xóa ca học:', error);
            }
        }
    };

    const handleStudentSelect = (mssv) => {
        setSelectedStudents(prev => {
            if (prev.includes(mssv)) {
                return prev.filter(id => id !== mssv);
            } else {
                return [...prev, mssv];
            }
        });
    };

    return (
        <div className="class-sessions-container">
            <h2>Quản Lý Ca Học</h2>

            <button
                className="add-session-btn"
                onClick={() => setShowAddForm(!showAddForm)}
            >
                {showAddForm ? 'Hủy' : 'Thêm Ca Học Mới'}
            </button>

            {showAddForm && (
                <form className="add-session-form" onSubmit={handleAddSession}>
                    <div className="form-group">
                        <label>Ngày:</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Ca học:</label>
                        <select
                            value={formData.time_slot}
                            onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                            required
                        >
                            <option value="">Chọn ca học</option>
                            <option value="Ca 1 (7:00 - 11:00)">Ca 1 (7:00 - 11:00)</option>
                            <option value="Ca 2 (13:00 - 17:00)">Ca 2 (13:00 - 17:00)</option>
                            <option value="Ca 3 (17:00 - 21:00)">Ca 3 (17:00 - 21:00)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Phòng học:</label>
                        <input
                            type="text"
                            value={formData.room}
                            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Chọn sinh viên:</label>
                        <div className="student-selection">
                            {students && students.length > 0 ? (
                                students.map(student => (
                                    <div key={student.mssv} className="student-checkbox">
                                        <input
                                            type="checkbox"
                                            id={student.mssv}
                                            checked={selectedStudents.includes(student.mssv)}
                                            onChange={() => handleStudentSelect(student.mssv)}
                                        />
                                        <label htmlFor={student.mssv}>
                                            {student.hoten} - {student.mssv}
                                        </label>
                                    </div>
                                ))
                            ) : (
                                <p>Không có sinh viên nào</p>
                            )}
                        </div>
                    </div>
                    <button type="submit" className="submit-btn">Thêm Ca Học</button>
                </form>
            )}

            <div className="sessions-list">
                <table>
                    <thead>
                        <tr>
                            <th>Ngày</th>
                            <th>Ca học</th>
                            <th>Phòng học</th>
                            <th>Sinh viên</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map(session => (
                            <tr key={session.id}>
                                <td>{session.date}</td>
                                <td>{session.time_slot}</td>
                                <td>{session.room}</td>
                                <td>
                                    <ul className="student-list">
                                        {Array.isArray(session.students) && session.students.map((student, index) => (
                                            <li key={index}>{student}</li>
                                        ))}
                                    </ul>
                                </td>
                                <td>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDeleteSession(session.id)}
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClassSessions; 