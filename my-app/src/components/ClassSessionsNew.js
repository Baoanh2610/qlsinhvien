import React, { useState, useEffect } from 'react';
import './ClassSessions.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const ClassSessionsNew = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        time_slot: '',
        room: '',
    });
    const [formErrors, setFormErrors] = useState({});

    const timeSlotOptions = [
        'Ca 1 (7:00 - 11:00)',
        'Ca 2 (13:00 - 17:00)',
        'Ca 3 (18:00 - 21:00)',
    ];

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/class-sessions`);
            console.log('Response from backend:', response.data);

            if (response.data && response.data.success) {
                const sessionsData = response.data.sessions;
                console.log('Sessions data:', sessionsData);
                setSessions(sessionsData);
            } else {
                console.error('Dữ liệu ca học không hợp lệ:', response.data);
                setSessions([]);
                toast.error("Dữ liệu ca học không hợp lệ");
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách ca học:", error);
            toast.error("Không thể tải danh sách ca học");
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.date) errors.date = 'Vui lòng chọn ngày';
        if (!formData.time_slot) errors.time_slot = 'Vui lòng chọn ca học';
        if (!formData.room) errors.room = 'Vui lòng nhập phòng học';
        else if (formData.room.length > 10) errors.room = 'Phòng học không được dài quá 10 ký tự';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddSession = async (e) => {
        e.preventDefault();
        setFormErrors({});

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/class-sessions`, {
                date: formData.date,
                time_slot: formData.time_slot,
                room: formData.room,
                students: [], // Tạm thời để rỗng, có thể thêm sau
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true,
            });

            if (response.data.success) {
                toast.success(response.data.message);
                setFormData({ date: '', time_slot: '', room: '' }); // Reset form
                await fetchSessions(); // Làm mới danh sách
            } else {
                toast.error(response.data.message || 'Không thể thêm ca học');
            }
        } catch (error) {
            console.error('Lỗi khi thêm ca học:', error);
            toast.error(error.response?.data?.message || 'Không thể thêm ca học');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="class-sessions-container">
            <h2>Quản Lý Ca Học</h2>

            {/* Form thêm ca học */}
            <div className="add-session-form">
                <h3>Thêm Ca Học Mới</h3>
                <form onSubmit={handleAddSession}>
                    <div className="form-group">
                        <label>Ngày:</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            className={formErrors.date ? 'input-error' : ''}
                        />
                        {formErrors.date && <p className="error-text">{formErrors.date}</p>}
                    </div>
                    <div className="form-group">
                        <label>Ca học:</label>
                        <select
                            name="time_slot"
                            value={formData.time_slot}
                            onChange={handleInputChange}
                            className={formErrors.time_slot ? 'input-error' : ''}
                        >
                            <option value="">Chọn ca học</option>
                            {timeSlotOptions.map((slot, index) => (
                                <option key={index} value={slot}>{slot}</option>
                            ))}
                        </select>
                        {formErrors.time_slot && <p className="error-text">{formErrors.time_slot}</p>}
                    </div>
                    <div className="form-group">
                        <label>Phòng học:</label>
                        <input
                            type="text"
                            name="room"
                            value={formData.room}
                            onChange={handleInputChange}
                            placeholder="VD: C606"
                            className={formErrors.room ? 'input-error' : ''}
                        />
                        {formErrors.room && <p className="error-text">{formErrors.room}</p>}
                    </div>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Đang thêm...' : 'Thêm ca học'}
                    </button>
                </form>
            </div>

            {/* Danh sách ca học */}
            <h3>Danh Sách Ca Học</h3>
            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : sessions.length > 0 ? (
                <div className="sessions-list">
                    <table>
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Ca học</th>
                                <th>Phòng học</th>
                                <th>Ngày tạo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(session => (
                                <tr key={session.id}>
                                    <td>{session.date}</td>
                                    <td>{session.time_slot}</td>
                                    <td>{session.room}</td>
                                    <td>{session.created_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>Không có ca học nào</p>
            )}
        </div>
    );
};

export default ClassSessionsNew;