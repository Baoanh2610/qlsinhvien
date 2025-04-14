import React, { useState, useEffect } from 'react';
import './ClassSessions.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const ClassSessions = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSession, setNewSession] = useState({
        time_slot: '',
        room: ''
    });

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/class-sessions`);
            console.log('API Response:', response.data);

            // Kiểm tra và xử lý dữ liệu
            if (response.data && response.data.success) {
                const sessionsData = response.data.sessions || [];
                if (Array.isArray(sessionsData)) {
                    setSessions(sessionsData);
                } else {
                    console.error('Dữ liệu sessions không phải là mảng:', sessionsData);
                    setSessions([]);
                    toast.error('Dữ liệu ca học không hợp lệ');
                }
            } else {
                console.error('Response không hợp lệ:', response.data);
                setSessions([]);
                toast.error('Dữ liệu ca học không hợp lệ');
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách ca học:', error);
            toast.error('Không thể tải danh sách ca học');
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSession = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/class-sessions`, newSession);

            if (response.data && response.data.success) {
                toast.success('Thêm ca học thành công');
                setShowAddForm(false);
                setNewSession({ time_slot: '', room: '' });
                fetchSessions();
            } else {
                toast.error(response.data?.message || 'Thêm ca học thất bại');
            }
        } catch (error) {
            console.error('Lỗi khi thêm ca học:', error);
            toast.error('Không thể thêm ca học');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSession = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa ca học này?')) {
            try {
                setLoading(true);
                const response = await axios.delete(`${process.env.REACT_APP_API_URL}/class-sessions/${id}`);

                if (response.data && response.data.success) {
                    toast.success('Xóa ca học thành công');
                    fetchSessions();
                } else {
                    toast.error(response.data?.message || 'Xóa ca học thất bại');
                }
            } catch (error) {
                console.error('Lỗi khi xóa ca học:', error);
                toast.error('Không thể xóa ca học');
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    return (
        <div className="class-sessions-container">
            <h2>Quản Lý Ca Học</h2>

            <button
                className="add-session-btn"
                onClick={() => setShowAddForm(!showAddForm)}
                disabled={loading}
            >
                {showAddForm ? 'Hủy' : 'Thêm Ca Học Mới'}
            </button>

            {showAddForm && (
                <form className="add-session-form" onSubmit={handleAddSession}>
                    <div className="form-group">
                        <label>Ca học:</label>
                        <input
                            type="text"
                            value={newSession.time_slot}
                            onChange={(e) => setNewSession({ ...newSession, time_slot: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Phòng:</label>
                        <input
                            type="text"
                            value={newSession.room}
                            onChange={(e) => setNewSession({ ...newSession, room: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Thêm'}
                    </button>
                </form>
            )}

            <div className="sessions-list">
                {loading ? (
                    <p>Đang tải dữ liệu...</p>
                ) : sessions && sessions.length > 0 ? (
                    sessions.map(session => (
                        <div key={session.id} className="session-card">
                            <div className="session-details">
                                <h3>{session.time_slot}</h3>
                                <p>Phòng: {session.room}</p>
                            </div>
                            <div className="session-actions">
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteSession(session.id)}
                                    disabled={loading}
                                >
                                    Xóa
                                </button>
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