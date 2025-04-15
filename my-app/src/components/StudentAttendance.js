import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './StudentAttendance.css';

const StudentAttendance = () => {
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "student") {
            navigate("/login");
            return;
        }

        const mssv = storedUser.student.mssv;
        if (!mssv) {
            setError("Không tìm thấy MSSV trong thông tin người dùng");
            setLoading(false);
            return;
        }

        fetchAttendance(mssv);
    }, [navigate]);

    const fetchAttendance = async (mssv) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/get_attendance_by_student.php?mssv=${mssv}`);
            if (!response.ok) {
                throw new Error('Không thể tải dữ liệu điểm danh');
            }
            const data = await response.json();
            if (data.success) {
                setAttendanceRecords(data.data.attendance);
            } else {
                throw new Error(data.message || 'Không thể tải dữ liệu điểm danh');
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Đang tải...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="student-attendance-container">
            <h2>Kết quả điểm danh</h2>
            {attendanceRecords.length > 0 ? (
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>Ngày</th>
                            <th>Ca học</th>
                            <th>Phòng</th>
                            <th>Trạng thái</th>
                            <th>Thời gian điểm danh</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendanceRecords.map((record, index) => (
                            <tr key={index}>
                                <td>{record.date}</td>
                                <td>{record.time_slot}</td>
                                <td>{record.room}</td>
                                <td>{record.status === 'present' ? 'Có mặt' : record.status === 'absent' ? 'Vắng' : 'Chưa điểm danh'}</td>
                                <td>{record.time || 'Chưa có'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>Chưa có dữ liệu điểm danh.</p>
            )}
        </div>
    );
};

export default StudentAttendance;