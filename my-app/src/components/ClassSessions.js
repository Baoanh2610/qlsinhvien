import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ClassSessions.css';

const fetchSessions = async () => {
    const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/class-sessions`);
    if (!data.success || !Array.isArray(data.sessions)) {
        throw new Error('Dữ liệu ca học không hợp lệ');
    }
    return data.sessions;
};

const fetchStudents = async () => {
    const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/get-students`);
    if (!data.success || !Array.isArray(data.students)) {
        throw new Error('Dữ liệu sinh viên không hợp lệ');
    }
    return data.students;
};

const fetchSessionStudents = async (sessionId) => {
    const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/session-students/${sessionId}`);
    if (!data.success || !Array.isArray(data.students)) {
        return [];
    }
    return data.students;
};

const SessionCard = ({ session, studentsBySession, onEdit, onDelete }) => {
    const students = studentsBySession[session.id] || [];
    return (
        <div className="session-card">
            <div className="session-details">
                <h3>{session.time_slot}</h3>
                <p>Ngày: {session.date}</p>
                <p>Phòng: {session.room}</p>
            </div>
            <div className="session-students">
                <h4>Danh sách sinh viên:</h4>
                {students.length > 0 ? (
                    students.map(student => (
                        <div key={student.mssv} className="student-item">
                            {student.hoten} - {student.mssv}
                        </div>
                    ))
                ) : (
                    <p>Không có sinh viên</p>
                )}
            </div>
            <div className="session-actions">
                <button className="edit-btn" onClick={() => onEdit(session)}>Chỉnh sửa</button>
                <button className="delete-btn" onClick={() => onDelete(session.id)}>Xóa</button>
            </div>
        </div>
    );
};

const AddSessionForm = ({ onClose, students }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ date: '', time_slot: '', room: '' });
    const [selectedStudents, setSelectedStudents] = useState([]);

    const mutation = useMutation({
        mutationFn: async (newSession) => {
            const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/class-sessions`, newSession);
            if (!data.success) throw new Error(data.message || 'Lỗi khi thêm ca học');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['sessions']);
            queryClient.invalidateQueries(['students']);
            setFormData({ date: '', time_slot: '', room: '' });
            setSelectedStudents([]);
            toast.success('Thêm ca học thành công');
            onClose();
        },
        onError: (error) => {
            toast.error(error.message || 'Không thể thêm ca học');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate({
            date: formData.date,
            time_slot: formData.time_slot,
            room: formData.room,
            students: selectedStudents,
        });
    };

    const handleStudentSelect = (mssv) => {
        setSelectedStudents(prev =>
            prev.includes(mssv) ? prev.filter(id => id !== mssv) : [...prev, mssv]
        );
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h3>Thêm ca học mới</h3>
                <form onSubmit={handleSubmit}>
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
                            {Array.isArray(students) && students.length > 0 ? (
                                students.map(student => (
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
                                ))
                            ) : (
                                <p>Không có sinh viên</p>
                            )}
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="submit" disabled={mutation.isLoading}>
                            {mutation.isLoading ? 'Đang xử lý...' : 'Thêm ca học'}
                        </button>
                        <button type="button" onClick={onClose}>Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditSessionForm = ({ session, students, studentsBySession, onClose }) => {
    const queryClient = useQueryClient();
    const [selectedStudents, setSelectedStudents] = useState([]);

    const mutation = useMutation({
        mutationFn: async ({ id, students }) => {
            const { data } = await axios.put(`${process.env.REACT_APP_API_URL}/class-sessions`, { id, students });
            if (!data.success) throw new Error(data.message || 'Lỗi khi cập nhật ca học');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['sessions']);
            queryClient.invalidateQueries(['students']);
            toast.success('Cập nhật ca học thành công');
            setSelectedStudents([]);
            onClose();
        },
        onError: (error) => {
            toast.error(error.message || 'Không thể cập nhật ca học');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { data } = await axios.delete(`${process.env.REACT_APP_API_URL}/class-sessions?id=${id}`);
            if (!data.success) throw new Error(data.message || 'Lỗi khi xóa ca học');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['sessions']);
            queryClient.invalidateQueries(['students']);
            toast.success('Xóa ca học thành công');
            onClose();
        },
        onError: (error) => {
            toast.error(error.message || 'Không thể xóa ca học');
        },
    });

    const handleAddStudents = () => {
        if (selectedStudents.length === 0) {
            toast.error('Vui lòng chọn ít nhất một sinh viên');
            return;
        }
        const currentStudents = studentsBySession[session.id] || [];
        const newStudents = students.filter(s => selectedStudents.includes(s.mssv));
        const updatedStudents = [...currentStudents, ...newStudents].map(s => s.mssv);
        mutation.mutate({ id: session.id, students: updatedStudents });
    };

    const handleRemoveStudent = (mssv) => {
        const updatedStudents = (studentsBySession[session.id] || [])
            .filter(student => student.mssv !== mssv)
            .map(s => s.mssv);
        if (updatedStudents.length === 0) {
            if (window.confirm('Ca học sẽ bị xóa vì không còn sinh viên. Bạn có chắc chắn?')) {
                deleteMutation.mutate(session.id);
            }
        } else {
            mutation.mutate({ id: session.id, students: updatedStudents });
        }
    };

    const handleStudentSelect = (mssv) => {
        setSelectedStudents(prev =>
            prev.includes(mssv) ? prev.filter(id => id !== mssv) : [...prev, mssv]
        );
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h3>Chỉnh sửa ca học: {session.time_slot}</h3>
                <div className="form-group">
                    <label>Danh sách sinh viên hiện tại:</label>
                    {Array.isArray(studentsBySession[session.id]) && studentsBySession[session.id].length > 0 ? (
                        studentsBySession[session.id].map(student => (
                            <div key={student.mssv} className="student-item">
                                {student.hoten} - {student.mssv}
                                <button
                                    className="remove-student-btn"
                                    onClick={() => handleRemoveStudent(student.mssv)}
                                >
                                    Xóa
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>Không có sinh viên</p>
                    )}
                </div>
                <div className="form-group">
                    <label>Thêm sinh viên:</label>
                    <div className="student-selection">
                        {Array.isArray(students) && students.length > 0 ? (
                            students.map(student => (
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
                            ))
                        ) : (
                            <p>Không có sinh viên</p>
                        )}
                    </div>
                </div>
                <div className="form-actions">
                    <button onClick={handleAddStudents} disabled={mutation.isLoading}>
                        {mutation.isLoading ? 'Đang xử lý...' : 'Thêm sinh viên'}
                    </button>
                    <button type="button" onClick={onClose}>Hủy</button>
                </div>
            </div>
        </div>
    );
};

const ClassSessions = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const queryClient = useQueryClient();

    const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: fetchSessions,
        onError: () => toast.error('Không thể tải danh sách ca học'),
    });

    const { data: students = [], isLoading: studentsLoading } = useQuery({
        queryKey: ['students'],
        queryFn: fetchStudents,
        onError: () => toast.error('Không thể tải danh sách sinh viên'),
    });

    const studentsBySession = {};
    sessions.forEach(session => {
        const { data: sessionStudents = [] } = useQuery({
            queryKey: ['sessionStudents', session.id],
            queryFn: () => fetchSessionStudents(session.id),
            enabled: !!session.id,
        });
        studentsBySession[session.id] = sessionStudents;
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { data } = await axios.delete(`${process.env.REACT_APP_API_URL}/class-sessions?id=${id}`);
            if (!data.success) throw new Error(data.message || 'Lỗi khi xóa ca học');
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['sessions']);
            queryClient.invalidateQueries(['students']);
            toast.success('Xóa ca học thành công');
        },
        onError: (error) => {
            toast.error(error.message || 'Không thể xóa ca học');
        },
    });

    const handleDelete = (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa ca học này?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="class-sessions-container">
            <h2>Quản Lý Ca Học</h2>
            <button className="add-session-btn" onClick={() => setShowAddModal(true)}>
                Thêm Ca Học Mới
            </button>

            {showAddModal && (
                <AddSessionForm
                    students={students}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {editingSession && (
                <EditSessionForm
                    session={editingSession}
                    students={students}
                    studentsBySession={studentsBySession}
                    onClose={() => setEditingSession(null)}
                />
            )}

            <div className="sessions-list">
                {sessionsLoading || studentsLoading ? (
                    <p>Đang tải dữ liệu...</p>
                ) : sessions.length > 0 ? (
                    sessions.map(session => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            studentsBySession={studentsBySession}
                            onEdit={() => setEditingSession(session)}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <p>Không có ca học nào</p>
                )}
            </div>
        </div>
    );
};

export default ClassSessions;