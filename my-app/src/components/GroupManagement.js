import React, { useState, useEffect, useCallback } from 'react';
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
        maxMembers: 5,
    });
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [editingGroup, setEditingGroup] = useState(null);
    const [editMode, setEditMode] = useState(null);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);

    const fetchSessions = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/class-sessions`);  { cache: "no-store" }
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.success && data.data) {
                setSessions(data.data);
            } else {
                toast.error('Dữ liệu không đúng định dạng');
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
            toast.error('Không thể tải danh sách ca học');
        }
    }, []);

    const filterStudentsWithoutGroup = useCallback(async (sessionId, allStudents) => {
        try {
            const groupResponse = await fetch(
                `${process.env.REACT_APP_API_URL}/get-groups?session_id=${sessionId}`,
                { cache: "no-store" }
            );
            const groupData = await groupResponse.json();
            if (groupData.success && groupData.groups) {
                const groupedStudents = new Set();
                groupData.groups.forEach((group) => {
                    group.member_mssvs.forEach((mssv) => groupedStudents.add(mssv));
                });
                return allStudents.filter((student) => !groupedStudents.has(student.mssv));
            }
            return allStudents;
        } catch (error) {
            console.error('Error filtering students:', error);
            return allStudents;
        }
    }, []);

    const fetchStudents = useCallback(
        async (sessionId) => {
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/get-students-by-session?session_id=${sessionId}`,
                    { cache: "no-store" }
                );
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                if (data.success && data.data && Array.isArray(data.data.students)) {
                    const studentsWithoutGroup = await filterStudentsWithoutGroup(
                        sessionId,
                        data.data.students
                    );
                    setStudents(studentsWithoutGroup);
                } else {
                    toast.error('Không thể tải danh sách sinh viên');
                }
            } catch (error) {
                console.error('Error fetching students:', error);
                toast.error('Không thể tải danh sách sinh viên');
            }
        },
        [filterStudentsWithoutGroup]
    );

    const fetchGroups = useCallback(async (sessionId) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/get-groups?session_id=${sessionId}`,
                { cache: "no-store" }
            );
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.success && data.groups) {
                setGroups(data.groups);
            } else {
                toast.error(data.message || 'Không thể tải danh sách nhóm');
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
            toast.error('Không thể tải danh sách nhóm');
        }
    }, []);

    const handleSendNotification = useCallback(
        async (e) => {
            e.preventDefault();
            if (!selectedSession) {
                toast.error('Vui lòng chọn ca học');
                return;
            }
            if (!notificationMessage.trim()) {
                toast.error('Vui lòng nhập nội dung thông báo');
                return;
            }

            setLoading(true);
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/send-notification`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            session_id: selectedSession,
                            message: notificationMessage,
                            created_by: 1,
                        }),
                        cache: "no-store",
                    }
                );

                const contentType = response.headers.get('Content-Type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(`Server trả về dữ liệu không phải JSON: ${text}`);
                }

                const data = await response.json();
                if (data.success) {
                    toast.success('Gửi thông báo thành công');
                    setNotificationMessage('');
                    setIsNotificationDialogOpen(false);
                } else {
                    toast.error(data.message || 'Không thể gửi thông báo');
                }
            } catch (error) {
                console.error('Error sending notification:', error);
                toast.error(`Không thể gửi thông báo: ${error.message}`);
            } finally {
                setLoading(false);
            }
        },
        [selectedSession, notificationMessage]
    );

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    useEffect(() => {
        if (selectedSession) {
            fetchStudents(selectedSession);
            fetchGroups(selectedSession);
        }
    }, [selectedSession, fetchStudents, fetchGroups]);

    const handleSessionChange = useCallback((e) => {
        const sessionId = e.target.value;
        setSelectedSession(sessionId);
        setEditingGroup(null);
        setEditMode(null);
        setGroupSettings((prev) => ({ ...prev, sessionId }));
        setNotificationMessage('');
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setGroupSettings((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (name === 'groupMode') {
            setSelectedStudents([]);
        }
    }, []);

    const handleStudentSelect = useCallback((mssv) => {
        setSelectedStudents((prev) => {
            if (prev.includes(mssv)) {
                return prev.filter((id) => id !== mssv);
            }
            return [...prev, mssv];
        });
    }, []);

    const handleCreateGroup = useCallback(
        async (e) => {
            e.preventDefault();
            if (!groupSettings.sessionId) {
                toast.error('Vui lòng chọn ca học');
                return;
            }
            if (
                (groupSettings.groupMode === 'teacher' || groupSettings.groupMode === 'student') &&
                selectedStudents.length === 0
            ) {
                toast.error('Vui lòng chọn sinh viên cho nhóm');
                return;
            }
    
            const payload = {
                session_id: groupSettings.sessionId,
                mode: groupSettings.groupMode,
                min_members: groupSettings.minMembers,
                max_members: groupSettings.maxMembers,
            };
    
            if (groupSettings.groupMode !== 'random') {
                payload.students = selectedStudents;
            }
    
            setLoading(true);
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/create-group`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                        cache: 'no-store', // 👉 thêm dòng này để luôn lấy dữ liệu mới
                    }
                );
                const data = await response.json();
                if (data.success) {
                    toast.success('Tạo nhóm thành công');
                    setGroupSettings((prev) => ({
                        ...prev,
                        sessionId: selectedSession,
                    }));
                    setSelectedStudents([]);
                    await fetchGroups(selectedSession);
                    await fetchStudents(selectedSession);
                } else {
                    toast.error(data.message || 'Không thể tạo nhóm');
                }
            } catch (error) {
                console.error('Error creating group:', error);
                toast.error('Không thể tạo nhóm. Vui lòng thử lại sau.');
            }
            setLoading(false);
        },
        [groupSettings, selectedStudents, selectedSession, fetchGroups, fetchStudents]
    );
    

    const handleUpdateGroup = useCallback(
        async (groupId, updatedStudents) => {
            setLoading(true);
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/group-management`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: groupId,
                            students: updatedStudents,
                        }),
                        cache: 'no-store',
                    }
                );
                const data = await response.json();
                if (data.success) {
                    toast.success('Cập nhật nhóm thành công');
                    setSelectedStudents([]);
                    await fetchGroups(selectedSession);
                    await fetchStudents(selectedSession);
                } else {
                    toast.error(data.message || 'Lỗi khi cập nhật nhóm');
                }
            } catch (error) {
                console.error('Error updating group:', error);
                toast.error('Lỗi khi cập nhật nhóm');
            }
            setLoading(false);
        },
        [selectedSession, fetchGroups, fetchStudents]
    );

    const handleDeleteGroup = useCallback(
        async (groupId) => {
            setLoading(true);
            try {
                const response = await fetch(
                    `${process.env.REACT_APP_API_URL}/delete-group?group_id=${groupId}`,
                    {cache: 'no-store'},
                    { credentials: 'include' }
                );
                const data = await response.json();
                if (data.success) {
                    toast.success('Xóa nhóm thành công');
                    setEditingGroup(null);
                    setEditMode(null);
                    await fetchGroups(selectedSession);
                    await fetchStudents(selectedSession);
                } else {
                    toast.error(data.message || 'Lỗi khi xóa nhóm');
                }
            } catch (error) {
                console.error('Error deleting group:', error);
                toast.error('Lỗi khi xóa nhóm');
            }
            setLoading(false);
        },
        [selectedSession, fetchGroups, fetchStudents]
    );

    const handleEditGroup = useCallback((group) => {
        setEditingGroup(group);
        setSelectedStudents([]);
        setEditMode(null);
    }, []);

    const handleRemoveMember = useCallback(
        async (groupId, mssv) => {
            const updatedStudents = editingGroup.members
                .map((member) => member.mssv)
                .filter((id) => id !== mssv);

            if (updatedStudents.length === 0) {
                await handleDeleteGroup(groupId);
            } else {
                await handleUpdateGroup(groupId, updatedStudents);
                setEditingGroup((prev) => ({
                    ...prev,
                    members: prev.members.filter((member) => member.mssv !== mssv),
                    member_count: updatedStudents.length,
                }));
            }
        },
        [editingGroup, handleDeleteGroup, handleUpdateGroup]
    );

    const handleAddMembers = useCallback(() => {
        if (selectedStudents.length === 0) {
            toast.error('Vui lòng chọn ít nhất một sinh viên để thêm');
            return;
        }
        const updatedStudents = [
            ...new Set([...editingGroup.members.map((m) => m.mssv), ...selectedStudents]),
        ];
        handleUpdateGroup(editingGroup.id, updatedStudents);
        setEditingGroup((prev) => ({
            ...prev,
            members: [
                ...prev.members,
                ...students.filter((student) => selectedStudents.includes(student.mssv)),
            ],
            member_count: updatedStudents.length,
        }));
    }, [editingGroup, selectedStudents, students, handleUpdateGroup]);

    const handleRefresh = useCallback(async () => {
        setGroupSettings({
            sessionId: selectedSession,
            groupMode: 'random',
            minMembers: 2,
            maxMembers: 5,
        });
        setSelectedStudents([]);
        setEditingGroup(null);
        setEditMode(null);
        setNotificationMessage('');

        setLoading(true);
        try {
            await fetchSessions();
            if (selectedSession) {
                await Promise.all([fetchStudents(selectedSession), fetchGroups(selectedSession)]);
                toast.success('Dữ liệu đã được làm mới thành công');
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
            toast.error('Không thể làm mới dữ liệu');
        }
        setLoading(false);
    }, [selectedSession, fetchSessions, fetchStudents, fetchGroups]);

    return (
        <div className="group-management">
            <div className="header">
                <h2>Quản Lý Nhóm</h2>
                {selectedSession && (
                    <button
                        className="notification-bell"
                        onClick={() => setIsNotificationDialogOpen(true)}
                        title="Gửi thông báo"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#2c3e50"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </button>
                )}
            </div>

            {isNotificationDialogOpen && (
                <div className="notification-dialog">
                    <div className="notification-dialog-content">
                        <div className="notification-dialog-header">
                            <h3>Gửi Thông Báo</h3>
                            <button
                                className="close-btn"
                                onClick={() => setIsNotificationDialogOpen(false)}
                                disabled={loading}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSendNotification}>
                            <div className="form-group">
                                <label>Nội Dung Thông Báo:</label>
                                <textarea
                                    value={notificationMessage}
                                    onChange={(e) => setNotificationMessage(e.target.value)}
                                    placeholder="Nhập nội dung thông báo..."
                                    rows="4"
                                    disabled={loading}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? 'Đang Gửi...' : 'Gửi Thông Báo'}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setIsNotificationDialogOpen(false)}
                                    disabled={loading}
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="session-selector">
                <label>Chọn Ca Học:</label>
                <select value={selectedSession} onChange={handleSessionChange} disabled={loading}>
                    <option value="">Chọn ca học</option>
                    {sessions.map((session) => (
                        <option key={session.id} value={session.id}>
                            {session.date} - {session.time_slot} - {session.room}
                        </option>
                    ))}
                </select>
            </div>

            {selectedSession && (
                <>
                    <div className="create-group-form">
                        <h3>Tạo Nhóm Mới</h3>
                        <form onSubmit={handleCreateGroup}>
                            <div className="form-group">
                                <label>Chế Độ Chia Nhóm:</label>
                                <select
                                    name="groupMode"
                                    value={groupSettings.groupMode}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
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
                                    disabled={loading}
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
                                    disabled={loading}
                                />
                            </div>

                            {(groupSettings.groupMode === 'teacher' ||
                                groupSettings.groupMode === 'student') && (
                                    <div className="student-selection">
                                        <h4>Danh Sách Sinh Viên Chưa Có Nhóm:</h4>
                                        <div className="student-list">
                                            {students.length === 0 ? (
                                                <p>Không còn sinh viên nào chưa có nhóm</p>
                                            ) : (
                                                students.map((student) => (
                                                    <div key={student.mssv} className="student-item">
                                                        <input
                                                            type="checkbox"
                                                            id={student.mssv}
                                                            checked={selectedStudents.includes(student.mssv)}
                                                            onChange={() => handleStudentSelect(student.mssv)}
                                                            disabled={loading}
                                                        />
                                                        <label htmlFor={student.mssv}>
                                                            {student.hoten} - {student.mssv}
                                                        </label>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <div className="selected-count">
                                            Đã chọn: {selectedStudents.length} sinh viên
                                        </div>
                                    </div>
                                )}

                            <div className="form-actions">
                                <button className="submit-btn" type="submit" disabled={loading}>
                                    {loading ? 'Đang Xử Lý...' : 'Tạo Nhóm'}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={handleRefresh}
                                    disabled={loading}
                                >
                                    {loading ? 'Đang Làm Mới...' : 'Làm Mới'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="groups-list">
                        <h3>Danh Sách Nhóm</h3>
                        {groups.length === 0 ? (
                            <p>Chưa có nhóm nào</p>
                        ) : (
                            groups.map((group) => (
                                <div key={group.id} className="group-card">
                                    <div className="group-header">
                                        <h4>{group.name}</h4>
                                        <div className="group-actions">
                                            <button
                                                className="edit-btn"
                                                onClick={() => handleEditGroup(group)}
                                                disabled={loading}
                                            >
                                                Chỉnh Sửa
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteGroup(group.id)}
                                                disabled={loading}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                    <div className="group-info">
                                        <span>
                                            Chế độ:{' '}
                                            {group.mode === 'random'
                                                ? 'Ngẫu Nhiên'
                                                : group.mode === 'teacher'
                                                    ? 'Giáo Viên Chỉ Định'
                                                    : 'Sinh Viên Tự Chọn'}
                                        </span>
                                        <span>Số thành viên: {group.member_count}</span>
                                    </div>
                                    {editingGroup && editingGroup.id === group.id && (
                                        <div className="edit-actions">
                                            <button
                                                className="add-btn"
                                                onClick={() => setEditMode('add')}
                                                disabled={loading}
                                            >
                                                Thêm
                                            </button>
                                            <button
                                                className="remove-btn"
                                                onClick={() => setEditMode('remove')}
                                                disabled={loading}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    )}
                                    <div className="group-members">
                                        <h5>Thành Viên:</h5>
                                        {group.members.length === 0 ? (
                                            <p>Chưa có thành viên</p>
                                        ) : (
                                            <ul>
                                                {group.members.map((member, index) => (
                                                    <li key={index}>
                                                        {member.hoten} ({member.mssv})
                                                        {editingGroup &&
                                                            editingGroup.id === group.id &&
                                                            editMode === 'remove' && (
                                                                <span
                                                                    className="remove-member"
                                                                    onClick={() =>
                                                                        handleRemoveMember(group.id, member.mssv)
                                                                    }
                                                                >
                                                                    ✗
                                                                </span>
                                                            )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {editingGroup &&
                                            editingGroup.id === group.id &&
                                            editMode === 'add' && (
                                                <div className="add-members">
                                                    <span
                                                        className="add-member-btn"
                                                        onClick={() => setEditMode('selecting')}
                                                    >
                                                        +
                                                    </span>
                                                </div>
                                            )}
                                        {editingGroup &&
                                            editingGroup.id === group.id &&
                                            editMode === 'selecting' && (
                                                <div className="student-selection">
                                                    <h4>Chọn Sinh Viên Để Thêm:</h4>
                                                    {students.length === 0 ? (
                                                        <p>Không còn sinh viên nào để thêm</p>
                                                    ) : (
                                                        <>
                                                            {students.map((student) => (
                                                                <div
                                                                    key={student.mssv}
                                                                    className="student-item"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`add-${student.mssv}`}
                                                                        checked={selectedStudents.includes(
                                                                            student.mssv
                                                                        )}
                                                                        onChange={() =>
                                                                            handleStudentSelect(student.mssv)
                                                                        }
                                                                        disabled={loading}
                                                                    />
                                                                    <label htmlFor={`add-${student.mssv}`}>
                                                                        {student.hoten} - {student.mssv}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                            <div className="form-actions">
                                                                <button
                                                                    className="submit-btn"
                                                                    onClick={handleAddMembers}
                                                                    disabled={loading}
                                                                >
                                                                    Thêm Vào Nhóm
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