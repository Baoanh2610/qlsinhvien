import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./StudentHome.css";

function StudentHome() {
    const [userInfo, setUserInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "student") {
            navigate("/login");
        } else {
            setUserInfo(storedUser);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    if (!userInfo) {
        return <div>Loading...</div>;
    }

    const student = userInfo.student || {};

    return (
        <div className="student-dashboard">
            <div className="sidebar">
                <h3>Menu Sinh Viên</h3>
                <ul>
                    <li><Link to="/student/profile">Thông tin cá nhân</Link></li>
                    <li><Link to="/student/attendance">Kết quả điểm danh</Link></li>
                    <li><Link to="/student/group">Nhóm</Link></li>
                    <li><Link to="/student/schedule">Ca học</Link></li>
                    <li>
                        <button className="logout-btn" onClick={handleLogout}>
                            Đăng xuất
                        </button>
                    </li>
                </ul>
            </div>

            <div className="main-content">
                <h2>Chào mừng đến trang Sinh Viên</h2>
                <div className="user-info">
                    <p><strong>Email:</strong> {userInfo.email}</p>
                    <p><strong>MSSV:</strong> {student.mssv || "Chưa có"}</p>
                    <p><strong>Họ Tên:</strong> {student.hoten || "Chưa có"}</p>
                    <p><strong>Khoa:</strong> {student.khoa || "Chưa có"}</p>
                    <p><strong>Lớp:</strong> {student.lop || "Chưa có"}</p>
                    <p><strong>Ngày Sinh:</strong> {student.ngaysinh || "Chưa có"}</p>
                </div>
            </div>
        </div>
    );
}

export default StudentHome;