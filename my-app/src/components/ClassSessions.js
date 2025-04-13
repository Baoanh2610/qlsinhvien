import React, { useState, useEffect, useCallback } from 'react';
import './ClassSessions.css';
import { toast } from 'react-toastify';

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
    const [editingSession, setEditingSession] = useState(null);
    const [editMode, setEditMode] = useState(null); // 'remove' hoặc 'add'
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSessions();
        fetchStudents();
    }, []);

    const fetchSessions = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/class-sessions`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.success && data.sessions) {
                setSessions(data.sessions);
            } else {
                toast.error('Dữ liệu không đúng định dạng');
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error('Không thể tải danh sách ca học');
        }
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/get-unassigned-students`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.success && Array.isArray(data.students)) {
                setStudents(data.students);
            } else {
                console.error('Dữ liệu sinh viên không đúng định dạng:', data);
                setStudents([]);
                toast.error('Dữ liệu sinh viên không đúng định dạng');
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách sinh viên:', error);
            setStudents([]);
            toast.error('Không thể tải danh sách sinh viên');
        }
    };

    const handleAddSession = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/class-sessions`, {
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
                await fetchSessions();
                await fetchStudents();
                toast.success('Thêm ca học thành công');
            } else {
                console.error('Lỗi khi thêm ca học:', data.message);
                toast.error(data.message || 'Lỗi khi thêm ca học');
            }
        } catch (error) {
            console.error('Lỗi khi thêm ca học:', error);
            toast.error('Không thể thêm ca học');
        }
        setLoading(false);
    };

    const handleUpdateSession = async (sessionId, updatedStudents) => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/class-sessions`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    id: sessionId,
                    students: updatedStudents
                }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Cập nhật ca học thành công');
                setSelectedStudents([]);
                await fetchSessions();
                await fetchStudents();
            } else {
                toast.error(data.message || 'Lỗi khi cập nhật ca học');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật ca học:', error);
            toast.error('Không thể cập nhật ca học');
        }
        setLoading(false);
    };

    const handleDeleteSession = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa ca học này?')) {
            setLoading(true);
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/class-sessions?id=${id}`, {
                    method: 'DELETE',
                    headers: { 'Accept': 'application/json' }
                });
                const data = await response.json();
                if (data.success) {
                    await fetchSessions();
                    await fetchStudents();
                    setEditingSession(null);
                    setEditMode(null);
                    toast.success('Xóa ca học thành công');
                } else {
                    toast.error(data.message || 'Lỗi khi xóa ca học');
                }
            } catch (error) {
                console.error('Lỗi khi xóa ca học:', error);
                toast.error('Không thể xóa ca học');
            }
            setLoading(false);
        }
    };

    const handleEditSession = (session) => {
        setEditingSession(session);
        setSelectedStudents([]);
        setEditMode(null);
    };

    const handleRemoveMember = async (sessionId, mssv) => {
        const updatedStudents = editingSession.student_mssvs.filter(id => id !== mssv);
        if (updatedStudents.length === 0) {
            await handleDeleteSession(sessionId);
        } else {
            await handleUpdateSession(sessionId, updatedStudents);
            setEditingSession(prev => ({
                ...prev,
                students: prev.students.filter((_, i) => prev.student_mssvs[i] !== mssv),
                student_mssvs: updatedStudents
            }));
        }
    };

    const handleAddMembers = async () => {
        if (selectedStudents.length === 0) {
            toast.error('Vui lòng chọn ít nhất một sinh viên để thêm');
            return;
        }
        const updatedStudents = [...new Set([...editingSession.student_mssvs, ...selectedStudents])];
        await handleUpdateSession(editingSession.id, updatedStudents);
        setEditingSession(prev => ({
            ...prev,
            students: [
                ...prev.students,
                ...students.filter(student => selectedStudents.includes(student.mssv)).map(s => s.hoten)
            ],
            student_mssvs: updatedStudents
        }));
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
                            {students.length > 0 ? (
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
                                <p>Không có sinh viên nào chưa được phân ca học</p>
                            )}
                        </div>
                    </div>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Đang Xử Lý...' : 'Thêm Ca Học'}
                    </button>
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
                                        {session.students ? (
                                            Array.isArray(session.students) ? (
                                                session.students.map((student, index) => (
                                                    <li key={index}>
                                                        {student.hoten} - {student.mssv}
                                                        {editingSession && editingSession.id === session.id && editMode === 'remove' && (
                                                            <span
                                                                className="remove-member"
                                                                onClick={() => handleRemoveMember(session.id, student.mssv)}
                                                            >
                                                                ✗
                                                            </span>
                                                        )}
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Không có sinh viên nào trong ca học này</li>
                                            )
                                        ) : (
                                            <li>Đang tải danh sách sinh viên...</li>
                                        )}
                                    </ul>
                                    {editingSession && editingSession.id === session.id && editMode === 'add' && (
                                        <div className="add-members">
                                            <span
                                                className="add-member-btn"
                                                onClick={() => setEditMode('selecting')}
                                            >
                                                +
                                            </span>
                                        </div>
                                    )}
                                    {editingSession && editingSession.id === session.id && editMode === 'selecting' && (
                                        <div className="student-selection">
                                            <h4>Chọn Sinh Viên Để Thêm:</h4>
                                            {students.length === 0 ? (
                                                <p>Không còn sinh viên nào để thêm</p>
                                            ) : (
                                                <>
                                                    {students.map(student => (
                                                        <div key={student.mssv} className="student-checkbox">
                                                            <input
                                                                type="checkbox"
                                                                id={`add-${student.mssv}`}
                                                                checked={selectedStudents.includes(student.mssv)}
                                                                onChange={() => handleStudentSelect(student.mssv)}
                                                            />
                                                            <label htmlFor={`add-${student.mssv}`}>
                                                                {student.hoten} - {student.mssv}
                                                            </label>
                                                        </div>
                                                    ))}
                                                    <div className="edit-actions">
                                                        <button
                                                            className="submit-btn"
                                                            onClick={handleAddMembers}
                                                            disabled={loading}
                                                        >
                                                            Thêm Vào Ca Học
                                                        </button>
                                                        <button
                                                            className="cancel-btn"
                                                            onClick={() => setEditMode(null)}
                                                            disabled={loading}
                                                        >
                                                            Hủy
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className="edit-btn"
                                        onClick={() => handleEditSession(session)}
                                    >
                                        Chỉnh Sửa
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDeleteSession(session.id)}
                                    >
                                        Xóa
                                    </button>
                                    {editingSession && editingSession.id === session.id && (
                                        <div className="edit-actions">
                                            <button
                                                className="add-btn"
                                                onClick={() => setEditMode('add')}
                                            >
                                                Thêm
                                            </button>
                                            <button
                                                className="remove-btn"
                                                onClick={() => setEditMode('remove')}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    )}
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