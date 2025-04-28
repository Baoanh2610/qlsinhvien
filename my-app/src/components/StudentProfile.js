// StudentProfile.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Thêm axios để gọi API
import "./StudentProfile.css";

function StudentProfile() {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (!storedUser || storedUser.role !== "student") {
            navigate("/login");
        } else {
            // Gọi API để lấy thông tin sinh viên mới nhất
            axios
                .get(`http://localhost:5000/get-student/${storedUser.mssv}`, {
                    withCredentials: true, // Gửi cookie/session để xác thực
                })
                .then((response) => {
                    if (response.data.success) {
                        setUserInfo(response.data.student);
                        setLoading(false);
                    } else {
                        setError(response.data.message);
                        setLoading(false);
                    }
                })
                .catch((err) => {
                    console.error("Lỗi khi lấy thông tin sinh viên:", err);
                    setError("Không thể tải thông tin sinh viên");
                    setLoading(false);
                });
        }
    }, [navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Lỗi: {error}</div>;
    }

    return (
        <div className="student-profile">
            <h2>Thông tin cá nhân</h2>
            <div className="profile-info">
                <p><strong>Email:</strong> {userInfo.email || "Chưa có"}</p>
                <p><strong>MSSV:</strong> {userInfo.mssv || "Chưa có"}</p>
                <p><strong>Họ Tên:</strong> {userInfo.hoten || "Chưa có"}</p>
                <p><strong>Khoa:</strong> {userInfo.khoa || "Chưa có"}</p>
                <p><strong>Lớp:</strong> {userInfo.lop || "Chưa có"}</p>
                <p><strong>Ngày Sinh:</strong> {userInfo.ngaysinh || "Chưa có"}</p>
            </div>
            <button onClick={() => navigate("/student/home")}>Quay lại</button>
        </div>
    );
}

export default StudentProfile;