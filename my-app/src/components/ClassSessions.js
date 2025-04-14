import React, { useState, useEffect } from 'react';
import './ClassSessions.css';
import { toast } from 'react-toastify';
import axios from 'axios';

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
    const [editMode, setEditMode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sessionStudents, setSessionStudents] = useState({});

    const fetchSessionStudents = async (sessionId) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/session-students/${sessionId}`);
            const studentsData = response.data.students;
            if (response.data.success && Array.isArray(studentsData)) {
                setSessionStudents(prev => ({
                    ...prev,
                    [sessionId]: studentsData
                }));
            } else {
                console.error(`Dữ liệu sinh viên không hợp lệ cho ca học ${sessionId}:`, studentsData);
                setSessionStudents(prev => ({
                    ...prev,
                    [sessionId]: []
                }));
            }
        } catch (error) {
            console.error(`Lỗi khi tải danh sách sinh viên của ca học ${sessionId}:`, error);
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
            const sessionsData = response.data.sessions;
            if (response.data.success && Array.isArray(sessionsData)) {
                setSessions(sessionsData);
                const initialSessionStudents = {};
                sessionsData.forEach(session => {
                    if (session && session.id) {
                        initialSessionStudents[session.id] = [];
                    }
                });
                setSessionStudents(initialSessionStudents);
                for (const session of sessionsData) {
                    if (session && session.id) {
                        await fetchSessionStudents(session.id);
                    }
                }
            } else {
                console.error('Dữ liệu ca học không hợp lệ:', sessionsData);
                setSessions([]);
                setSessionStudents({});
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
            console.log('Phản hồi API sinh viên:', response.data);
            const studentsData = response.data.students;
            if (response.data.success && Array.isArray(studentsData)) {
                setStudents(studentsData);
            } else {
                console.error('Dữ liệu sinh viên không hợp lệ:', studentsData);
                setStudents([]);
                toast.error("Dữ liệu sinh viên không hợp lệ");
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
        const loadData = async () => {
            await fetchStudents(); // Gọi tuần tự để tránh race condition
            await fetchSessions();
        };
        loadData();
    }, []);

    const handleAddSession = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/class-sessions`, {
                date: formData.date,
                time_slot: formData.time_slot,
                room: formData.room,
                students: selectedStudents
            });
            if (response.data.success) {
                setShowAddForm(false);
                setFormData({ date: '', time_slot: '', room: '' });
                setSelectedStudents([]);
                await fetchSessions();
                await fetchStudents();
                toast.success('Thêm ca học thành công');
            } else {
                console.error('Lỗi khi thêm ca học:', response.data.message);
                toast.error(response.data.message || 'Lỗi khi thêm ca học');
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
            const response = await axios.put(`${process.env.REACT_APP_API_URL}/class-sessions`, {
                id: sessionId,
                students: updatedStudents
            });
            if (response.data.success) {
                toast.success('Cập nhật ca học thành công');
                setSelectedStudents([]);
                await fetchSessions();
                await fetchStudents();
                setEditMode(null);
            } else {
                toast.error(response.data.message || 'Lỗi khi cập nhật ca học');
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
                const response = await axios.delete(`${process.env.REACT_APP_API_URL}/class-sessions?id=${id}`);
                if (response.data.success) {
                    await fetchSessions();
                    await fetchStudents();
                    setEditingSession(null);
                    setEditMode(null);
                    toast.success('Xóa ca học thành công');
                } else {
                    toast.error(response.data.message || 'Lỗi khi xóa ca học');
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
        if (!Array.isArray(sessionStudents[sessionId])) {
            console.error(`Không thể xóa sinh viên, sessionStudents[${sessionId}] không phải mảng`);
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
        const currentSessionStudents = Array.isArray(sessionStudents[sessionId])
            ? sessionStudents[sessionId]
            : [];
        const selectedStudentObjects = students.filter(s => selectedStudents.includes(s.mssv));
        const combinedStudents = [...currentSessionStudents, ...selectedStudentObjects];
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

    const renderStudentsList = () => {
        console.log('students trong renderStudentsList:', students);
        if (!Array.isArray(students) || students.length === 0) {
            return <p>Không có sinh viên nào</p>;
        }
        return students.map(student => (
            <div key={student.mssv} className="student-checkbox">
                <input
                    type="checkbox"
                    id={`edit-${student.mssv}`}
                    checked={selectedStudents.includes(student.mssv)}
                    onChange={() => handleStudentSelect(student.mssv)}
                />
                <label htmlFor={`edit-${student.mssv}`}>
                    {student.hoten} - {student.mssv}
                </label>
            </div>
        ));
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

            {editingSession && (
                <div className="edit-session-form">
                    <h3>Chỉnh sửa ca học: {editingSession.time_slot}</h3>
                    <div className="form-group">
                        <label>Danh sách sinh viên hiện tại:</label>
                        {Array.isArray(sessionStudents[editingSession.id]) && sessionStudents[editingSession.id].length > 0 ? (
                            sessionStudents[editingSession.id].map(student => (
                                <div key={student.mssv} className="student-item">
                                    {student.hoten} - {student.mssv}
                                    <button
                                        className="remove-student-btn"
                                        onClick={() => handleRemoveMember(editingSession.id, student.mssv)}
                                    >
                                        Xóa
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>Không có sinh viên trong ca học này</p>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Thêm sinh viên:</label>
                        <div className="student-selection">
                            {renderStudentsList()}
                        </div>
                    </div>
                    <button
                        className="add-members-btn"
                        onClick={handleAddMembers}
                        disabled={loading}
                    >
                        {loading ? 'Đang Xử Lý...' : 'Thêm Sinh Viên'}
                    </button>
                    <button
                        className="cancel-btn"
                        onClick={() => {
                            setEditingSession(null);
                            setEditMode(null);
                            setSelectedStudents([]);
                        }}
                    >
                        Hủy
                    </button>
                </div>
            )}

            <div className="sessions-list">
                {loading ? (
                    <p>Đang tải dữ liệu...</p>
                ) : Array.isArray(sessions) && sessions.length > 0 ? (
                    sessions.map(session => {
                        if (!session || !session.id) {
                            console.error('Dữ liệu ca học không hợp lệ:', session);
                            return null;
                        }
                        const currentStudents = Array.isArray(sessionStudents[session.id])
                            ? sessionStudents[session.id]
                            : [];
                        return (
                            <div key={session.id} className="session-card">
                                <div className="session-details">
                                    <h3>{session.time_slot}</h3>
                                    <p>Ngày: {session.date}</p>
                                    <p>Phòng: {session.room}</p>
                                </div>
                                <div className="session-students">
                                    <h4>Danh sách sinh viên:</h4>
                                    {currentStudents.length > 0 ? (
                                        currentStudents.map(student => {
                                            if (!student || !student.mssv) {
                                                console.error('Dữ liệu sinh viên không hợp lệ:', student);
                                                return null;
                                            }
                                            return (
                                                <div key={student.mssv} className="student-item">
                                                    {student.hoten} - {student.mssv}
                                                </div>
                                            );
                                        })
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
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p>Không có ca học nào</p>
                )}
            </div>
        </div>
    );
};

export default ClassSessions;