import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
            axios
                .get(`${process.env.REACT_APP_API_URL}/get-student-by-email`, {
                    params: { email: storedUser.email },
                    withCredentials: true,
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

    const handleLogout = async () => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/logout`, {}, { withCredentials: true });
            localStorage.removeItem("user");
            navigate("/login");
        } catch (err) {
            console.error("Lỗi khi đăng xuất:", err);
            localStorage.removeItem("user");
            navigate("/login");
        }
    };

    // Hàm định dạng ngày sinh
    const formatDate = (dateString) => {
        if (!dateString) return "Chưa có";
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

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
                <p>
                    <strong>Email:</strong> {userInfo.email || "Chưa có"}
                </p>
                <p>
                    <strong>MSSV:</strong> {userInfo.mssv || "Chưa có"}
                </p>
                <p>
                    <strong>Họ Tên:</strong> {userInfo.hoten || "Chưa có"}
                </p>
                <p>
                    <strong>Khoa:</strong> {userInfo.khoa || "Chưa có"}
                </p>
                <p>
                    <strong>Lớp:</strong> {userInfo.lop || "Chưa có"}
                </p>
                <p>
                    <strong>Ngày Sinh:</strong> {formatDate(userInfo.ngaysinh)}
                </p>
            </div>
            <button onClick={handleLogout}>Đăng xuất</button>
        </div>
    );
}

export default StudentProfile;