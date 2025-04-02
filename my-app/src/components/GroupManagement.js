import React, { useState, useEffect } from 'react';
import './GroupManagement.css';
import { toast } from 'react-toastify';

const GroupManagement = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [groupSettings, setGroupSettings] = useState({
        sessionId: '',
        groupMode: 'random',
        minMembers: 2,
        maxMembers: 5
    });
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [editingGroup, setEditingGroup] = useState(null);

    const fetchSessions = async () => {
        try {
            const response = await fetch('http://localhost/Home_React_baoanh/backend/class_sessions.php');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (Array.isArray(data)) {
                setSessions(data);
            } else {
                toast.error('Dữ liệu không đúng định dạng');
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error('Không thể tải danh sách ca học');
        }
    };

    const fetchStudents = async (sessionId) => {
        try {
            const response = await fetch(`http://localhost/Home_React_baoanh/backend/get_students_by_session.php?session_id=${sessionId}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.success && data.data && Array.isArray(data.data.students)) {
                setStudents(data.data.students);
            } else {
                toast.error('Không thể tải danh sách sinh viên');
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            toast.error('Không thể tải danh sách sinh viên');
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/get_groups.php`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.success) {
                setGroups(data.data.groups);
                console.log("Fetched groups:", data.data.groups);
            } else {
                toast.error(data.message || 'Không thể tải danh sách nhóm');
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            toast.error('Không thể tải danh sách nhóm');
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        if (selectedSession) {
            fetchStudents(selectedSession);
            fetchGroups();
        }
    }, [selectedSession]);

    const handleSessionChange = (e) => {
        const sessionId = e.target.value;
        setSelectedSession(sessionId);
        setEditingGroup(null);
        setGroupSettings(prev => ({ ...prev, sessionId }));
        if (sessionId) {
            fetchStudents(sessionId);
            fetchGroups();
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setGroupSettings(prev => ({
            ...prev,
            [name]: value
        }));
        if (name === 'groupMode') {
            setSelectedStudents([]);
        }
    };

    const handleStudentSelect = (mssv) => {
        setSelectedStudents(prev => {
            if (prev.includes(mssv)) {
                return prev.filter(id => id !== mssv);
            }
            return [...prev, mssv];
        });
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();

        if (!groupSettings.sessionId) {
            toast.error('Vui lòng chọn ca học');
            return;
        }

        if ((groupSettings.groupMode === 'teacher' || groupSettings.groupMode === 'student') && selectedStudents.length === 0) {
            toast.error('Vui lòng chọn sinh viên cho nhóm');
            return;
        }

        const payload = {
            session_id: groupSettings.sessionId,
            mode: groupSettings.groupMode,
            min_members: groupSettings.minMembers,
            max_members: groupSettings.maxMembers
        };

        // Chỉ gửi students nếu không phải chế độ random
        if (groupSettings.groupMode !== 'random') {
            payload.students = selectedStudents;
        }

        console.log("Sending to API:", payload);

        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/create_group.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            console.log("Response data:", data);

            if (data.success) {
                toast.success('Tạo nhóm thành công');
                setGroupSettings({
                    sessionId: selectedSession,
                    groupMode: 'random',
                    minMembers: 2,
                    maxMembers: 5
                });
                setSelectedStudents([]);
                await fetchGroups(); // Cập nhật danh sách nhóm
            } else {
                toast.error(data.message || 'Không thể tạo nhóm');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            toast.error('Không thể tạo nhóm');
        }
        setLoading(false);
    };

    const handleUpdateGroup = async (groupId) => {
        if (!selectedStudents.length) {
            toast.error('Vui lòng chọn sinh viên cho nhóm');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost/Home_React_baoanh/backend/group_management.php', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: groupId,
                    students: selectedStudents
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Cập nhật nhóm thành công');
                setEditingGroup(null);
                setSelectedStudents([]);
                await fetchGroups();
            } else {
                toast.error(data.message || 'Lỗi khi cập nhật nhóm');
            }
        } catch (error) {
            console.error('Error updating group:', error);
            toast.error('Lỗi khi cập nhật nhóm');
        }
        setLoading(false);
    };

    const handleDeleteGroup = async (groupId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa nhóm này?')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/delete_group.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    group_id: groupId
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Xóa nhóm thành công');
                await fetchGroups();
            } else {
                toast.error(data.message || 'Lỗi khi xóa nhóm');
            }
        } catch (error) {
            console.error('Error deleting group:', error);
            toast.error('Không thể xóa nhóm');
        }
        setLoading(false);
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
        setSelectedStudents(group.members.map(member => member.mssv));
        setGroupSettings({
            sessionId: group.session_id,
            groupMode: group.mode,
            minMembers: group.min_members,
            maxMembers: group.max_members
        });
    };

    return (
        <div className="group-management">
            <h2>Quản Lý Nhóm</h2>

            <div className="session-selector">
                <label>Chọn Ca Học:</label>
                <select value={selectedSession} onChange={handleSessionChange}>
                    <option value="">Chọn ca học</option>
                    {sessions.map(session => (
                        <option key={session.id} value={session.id}>
                            {session.date} - {session.time_slot} - {session.room}
                        </option>
                    ))}
                </select>
            </div>

            {selectedSession && (
                <>
                    <div className="create-group-form">
                        <h3>{editingGroup ? 'Chỉnh Sửa Nhóm' : 'Tạo Nhóm Mới'}</h3>
                        <form onSubmit={handleCreateGroup}>
                            <div className="form-group">
                                <label>Chế Độ Chia Nhóm:</label>
                                <select name="groupMode" value={groupSettings.groupMode} onChange={handleChange}>
                                    <option value="random">Ngẫu Nhiên</option>
                                    <option value="teacher">Giáo Viên Chỉ Định</option>
                                    <option value="student">Sinh Viên Tự Chọn</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Số Thành Viên Tối Thiểu:</label>
                                <input
                                    type="number"
                                    name="minMembers"
                                    value={groupSettings.minMembers}
                                    onChange={handleChange}
                                    min="1"
                                    max={groupSettings.maxMembers}
                                />
                            </div>
                            <div className="form-group">
                                <label>Số Thành Viên Tối Đa:</label>
                                <input
                                    type="number"
                                    name="maxMembers"
                                    value={groupSettings.maxMembers}
                                    onChange={handleChange}
                                    min={groupSettings.minMembers}
                                />
                            </div>

                            {(groupSettings.groupMode === 'teacher' || groupSettings.groupMode === 'student') && (
                                <div className="student-selection">
                                    <h4>Danh Sách Sinh Viên:</h4>
                                    <div className="student-list">
                                        {students.map(student => (
                                            <div key={student.mssv} className="student-item">
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
                                        ))}
                                    </div>
                                    <div className="selected-count">
                                        Đã chọn: {selectedStudents.length} sinh viên
                                    </div>
                                </div>
                            )}

                            <div className="form-actions">
                                <button className="submit-btn" type="submit" disabled={loading}>
                                    {loading ? 'Đang Xử Lý...' : (editingGroup ? 'Cập Nhật' : 'Tạo Nhóm')}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setGroupSettings({
                                            sessionId: selectedSession,
                                            groupMode: 'random',
                                            minMembers: 2,
                                            maxMembers: 5
                                        });
                                        setSelectedStudents([]);
                                        setEditingGroup(null);
                                    }}
                                >
                                    Làm Mới
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="groups-list">
                        <h3>Danh Sách Nhóm</h3>
                        {groups.length === 0 ? (
                            <p>Chưa có nhóm nào</p>
                        ) : (
                            groups.map(group => (
                                <div key={group.id} className="group-card">
                                    <div className="group-header">
                                        <h4>{group.name}</h4>
                                        <div className="group-actions">
                                            <button
                                                className="edit-btn"
                                                onClick={() => handleEditGroup(group)}
                                            >
                                                Chỉnh Sửa
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteGroup(group.id)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                    <div className="group-info">
                                        <span>Chế độ: {group.mode === 'random' ? 'Ngẫu Nhiên' :
                                            group.mode === 'teacher' ? 'Giáo Viên Chỉ Định' :
                                                'Sinh Viên Tự Chọn'}</span>
                                        <span>Số thành viên: {group.member_count}</span>
                                    </div>
                                    <div className="group-members">
                                        <h5>Thành Viên:</h5>
                                        {group.members.length === 0 ? (
                                            <p>Chưa có thành viên</p>
                                        ) : (
                                            <ul>
                                                {group.members.map((member, index) => (
                                                    <li key={index}>{member.hoten} ({member.mssv})</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default GroupManagement;