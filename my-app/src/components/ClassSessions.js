import React, { useState, useEffect, useCallback } from 'react';
import './ClassSessions.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const ClassSessions = () => {
    const [sessions, setSessions] = useState([]);  // Ensure this is initialized as an empty array
    const [students, setStudents] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [formData, setFormData] = useState({
        date: '',
        time_slot: '',
        room: ''
    });
    const [editingSession, setEditingSession] = useState(null);
    const [editMode, setEditMode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sessionStudents, setSessionStudents] = useState({});

    const fetchSessionStudents = async (sessionId) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/session-students/${sessionId}`);

            if (response.data.success && Array.isArray(response.data.students)) {
                setSessionStudents(prev => ({
                    ...prev,
                    [sessionId]: response.data.students
                }));
            } else {
                setSessionStudents(prev => ({
                    ...prev,
                    [sessionId]: []
                }));
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách sinh viên của ca học:", error);
            setSessionStudents(prev => ({
                ...prev,
                [sessionId]: []
            }));
        }
    };

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/class-sessions`);

            if (response.data.success && Array.isArray(response.data.sessions)) {
                setSessions(response.data.sessions);

                // Khởi tạo sessionStudents với mảng trống cho mỗi session
                const initialSessionStudents = {};
                response.data.sessions.forEach(session => {
                    initialSessionStudents[session.id] = [];
                });
                setSessionStudents(initialSessionStudents);

                // Lấy danh sách sinh viên cho từng session
                for (const session of response.data.sessions) {
                    await fetchSessionStudents(session.id);
                }
            } else {
                setSessions([]);
                setSessionStudents({});
                throw new Error("Dữ liệu ca học không đúng định dạng");
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách ca học:", error);
            toast.error("Không thể tải danh sách ca học");
            setSessions([]);
            setSessionStudents({});
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-students`);

            if (response.data.success && Array.isArray(response.data.students)) {
                setStudents(response.data.students);
            } else {
                setStudents([]);
                throw new Error("Dữ liệu sinh viên không đúng định dạng");
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách sinh viên:", error);
            toast.error("Không thể tải danh sách sinh viên");
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
        fetchStudents();
    }, []);

    const handleAddSession = async e => {
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
                })
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
                })
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

    const handleDeleteSession = async id => {
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

    const handleEditSession = session => {
        setEditingSession(session);
        setSelectedStudents([]);
        setEditMode(null);
    };

    const handleRemoveMember = async (sessionId, mssv) => {
        if (!sessionStudents[sessionId] || !Array.isArray(sessionStudents[sessionId])) {
            console.error(`Không thể xóa sinh viên, sessionStudents[${sessionId}] không phải là mảng`);
            return;
        }

        const updatedStudentsList = sessionStudents[sessionId]
            .filter(student => student.mssv !== mssv)
            .map(s => s.mssv);

        if (updatedStudentsList.length === 0) {
            await handleDeleteSession(sessionId);
        } else {
            await handleUpdateSession(sessionId, updatedStudentsList);
        }
    };

    const handleAddMembers = async () => {
        if (selectedStudents.length === 0) {
            toast.error('Vui lòng chọn ít nhất một sinh viên để thêm');
            return;
        }

        if (!editingSession || !editingSession.id) {
            toast.error('Không có ca học được chọn');
            return;
        }

        const sessionId = editingSession.id;

        // Đảm bảo sessionStudents[sessionId] là một mảng
        const currentSessionStudents = Array.isArray(sessionStudents[sessionId])
            ? sessionStudents[sessionId]
            : [];

        // Lấy danh sách MSSV hiện có
        const existingMssvs = currentSessionStudents.map(s => s.mssv);

        // Lấy thông tin sinh viên từ danh sách sinh viên chưa phân ca
        const selectedStudentObjects = students.filter(s => selectedStudents.includes(s.mssv));

        // Kết hợp hai danh sách và loại bỏ trùng lặp
        const combinedStudents = [
            ...currentSessionStudents,
            ...selectedStudentObjects
        ];

        // Lấy danh sách MSSV để gửi lên server
        const mssvList = combinedStudents.map(s => s.mssv);

        await handleUpdateSession(sessionId, mssvList);
        setSelectedStudents([]);
        setEditMode(null);
    };

    const handleStudentSelect = mssv => {
        setSelectedStudents(prev => {
            if (prev.includes(mssv)) {
                return prev.filter(id => id !== mssv);
            }
            return [...prev, mssv];
        });
    };

    return (
        <div className="class-sessions-container">
            <h2>Quản Lý Ca Học</h2>
            <button className="add-session-btn" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? 'Hủy' : 'Thêm Ca Học Mới'}
            </button>

            {showAddForm && (
                <form className="add-session-form" onSubmit={handleAddSession}>
                    <div className="form-group">
                        <label>Ngày:</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Ca học:</label>
                        <select
                            value={formData.time_slot}
                            onChange={e => setFormData({ ...formData, time_slot: e.target.value })}
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
                            onChange={e => setFormData({ ...formData, room: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Chọn sinh viên:</label>
                        <div className="student-selection">
                            {Array.isArray(students) && students.length > 0 ? (
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
                {loading ? (
                    <p>Đang tải dữ liệu...</p>
                ) : Array.isArray(sessions) && sessions.length > 0 ? (
                    sessions.map(session => (
                        <div key={session.id} className="session-card">
                            <div className="session-details">
                                <h3>{session.time_slot}</h3>
                                <p>{session.room}</p>
                            </div>
                            <div className="session-students">
                                {Array.isArray(sessionStudents[session.id]) ? (
                                    sessionStudents[session.id].map(student => (
                                        <div key={student.mssv} className="student-item">
                                            {student.hoten} - {student.mssv}
                                        </div>
                                    ))
                                ) : (
                                    <p>Không có sinh viên</p>
                                )}
                            </div>
                            <div className="session-actions">
                                <button className="edit-btn" onClick={() => handleEditSession(session)}>
                                    Chỉnh Sửa
                                </button>
                                <button className="delete-btn" onClick={() => handleDeleteSession(session.id)}>
                                    Xóa
                                </button>
                                {editingSession?.id === session.id && (
                                    <div className="edit-actions">
                                        <button className="add-btn" onClick={() => setEditMode('add')}>
                                            Thêm
                                        </button>
                                        <button className="remove-btn" onClick={() => setEditMode('remove')}>
                                            Xóa
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p>Không có ca học nào</p>
                )}
            </div>
        </div>
    );
};

export default ClassSessions;