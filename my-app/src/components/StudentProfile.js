// StudentProfile.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentProfile.css"; // Tạo file CSS nếu cần

function StudentProfile() {
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

    if (!userInfo) {
        return <div>Loading...</div>;
    }

    const student = userInfo.student || {};

    return (
        <div className="student-profile">
            <h2>Thông tin cá nhân</h2>
            <div className="profile-info">
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p><strong>MSSV:</strong> {student.mssv || "Chưa có"}</p>
                <p><strong>Họ Tên:</strong> {student.hoten || "Chưa có"}</p>
                <p><strong>Khoa:</strong> {student.khoa || "Chưa có"}</p>
                <p><strong>Lớp:</strong> {student.lop || "Chưa có"}</p>
                <p><strong>Ngày Sinh:</strong> {student.ngaysinh || "Chưa có"}</p>
            </div>
            <button onClick={() => navigate("/student/home")}>Quay lại</button>
        </div>
    );
}

export default StudentProfile;