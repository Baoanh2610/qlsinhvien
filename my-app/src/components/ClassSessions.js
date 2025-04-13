import React, { useState, useEffect, useCallback } from 'react';
import './ClassSessions.css';
import { toast } from 'react-toastify';

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

    const fetchSessionStudents = useCallback(async (sessionId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/get-session-students?session_id=${sessionId}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            console.log(`Session ${sessionId} students:`, data);

            // Luôn đảm bảo cập nhật state với một mảng
            if (data.success && Array.isArray(data.students)) {
                setSessionStudents(prev => ({
                    ...prev,
                    [sessionId]: data.students
                }));
                return data.students;
            } else {
                console.error(`Dữ liệu sinh viên không đúng định dạng cho session ${sessionId}:`, data);
                setSessionStudents(prev => ({
                    ...prev,
                    [sessionId]: []  // Mảng trống làm giá trị mặc định
                }));
                return [];
            }
        } catch (error) {
            console.error(`Lỗi khi lấy sinh viên cho session ${sessionId}:`, error);
            setSessionStudents(prev => ({
                ...prev,
                [sessionId]: []  // Mảng trống khi có lỗi
            }));
            return [];
        }
    }, []);

    const fetchSessions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/class-sessions`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            console.log('Sessions data:', data);

            // Always make sure we set sessions to an array
            if (data.success && Array.isArray(data.sessions)) {
                setSessions(data.sessions);

                // Khởi tạo sessionStudents với mảng trống cho mỗi session
                const initialSessionStudents = {};
                data.sessions.forEach(session => {
                    initialSessionStudents[session.id] = initialSessionStudents[session.id] || [];
                });
                setSessionStudents(prev => ({ ...prev, ...initialSessionStudents }));

                // Lấy danh sách sinh viên cho từng session
                for (const session of data.sessions) {
                    await fetchSessionStudents(session.id);
                }
            } else {
                console.error('Dữ liệu ca học không đúng định dạng:', data);
                toast.error('Dữ liệu ca học không đúng định dạng');
                setSessions([]);  // Ensure we set an empty array
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách ca học:', error);
            toast.error('Không thể tải danh sách ca học');
            setSessions([]);  // Ensure we set an empty array
        } finally {
            setLoading(false);
        }
    }, [fetchSessionStudents]);

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/get-unassigned-students`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();
            console.log('Unassigned students data:', data);
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

    useEffect(() => {
        fetchSessions();
        fetchStudents();
    }, [fetchSessions]);

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
                {loading && <p className="loading-message">Đang tải dữ liệu...</p>}

                {!loading && Array.isArray(sessions) && sessions.length === 0 && (
                    <p className="no-data-message">Không có ca học nào</p>
                )}

                {Array.isArray(sessions) && sessions.length > 0 && (
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
                                    <td>{new Date(session.date).toLocaleDateString()}</td>
                                    <td>{session.time_slot}</td>
                                    <td>{session.room}</td>
                                    <td>
                                        <ul className="student-list">
                                            {sessionStudents[session.id] === undefined ? (
                                                <li>Đang tải...</li>
                                            ) : !Array.isArray(sessionStudents[session.id]) ? (
                                                <li>Lỗi dữ liệu: Không phải danh sách sinh viên</li>
                                            ) : sessionStudents[session.id].length === 0 ? (
                                                <li>Không có sinh viên</li>
                                            ) : (
                                                sessionStudents[session.id].map((student, index) => (
                                                    <li key={student.mssv || `student-${index}`}>
                                                        {student.hoten} - {student.mssv}
                                                        {editingSession?.id === session.id && editMode === 'remove' && (
                                                            <span
                                                                className="remove-member"
                                                                onClick={() => handleRemoveMember(session.id, student.mssv)}
                                                            >
                                                                ✗
                                                            </span>
                                                        )}
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                        {editingSession?.id === session.id && editMode === 'add' && (
                                            <div className="add-members">
                                                <span className="add-member-btn" onClick={() => setEditMode('selecting')}>
                                                    +
                                                </span>
                                            </div>
                                        )}
                                        {editingSession?.id === session.id && editMode === 'selecting' && (
                                            <div className="student-selection">
                                                <h4>Chọn Sinh Viên:</h4>
                                                {Array.isArray(students) && students.length === 0 ? (
                                                    <p>Không còn sinh viên</p>
                                                ) : (
                                                    <>
                                                        {Array.isArray(students) && students.map(student => (
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
                                                                Thêm
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
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ClassSessions;