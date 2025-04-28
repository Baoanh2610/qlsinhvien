import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./StudentHome.css";

function StudentHome() {
  const [userInfo, setUserInfo] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "student") {
      navigate("/login");
    } else {
      setUserInfo(storedUser);
      fetchStudentInfo(storedUser.email); // Gọi hàm lấy info sinh viên
    }
  }, [navigate]);

  const fetchStudentInfo = async (email) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-student-by-email`, {
        params: { email },
        withCredentials: true,
      });
      if (response.data.success) {
        setStudentInfo(response.data.student);
      } else {
        console.error("Không tìm thấy thông tin sinh viên:", response.data.message);
        alert("Không tìm thấy thông tin sinh viên. Vui lòng liên hệ quản trị viên.");
        navigate("/login"); // Chuyển hướng về login nếu không tìm thấy
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin sinh viên:", error);
      alert("Lỗi khi tải thông tin sinh viên. Vui lòng thử lại sau.");
      navigate("/login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (!userInfo || !studentInfo) {
    return <div>Loading...</div>;
  }

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
          <p><strong>MSSV:</strong> {studentInfo.mssv}</p>
          <p><strong>Họ Tên:</strong> {studentInfo.hoten}</p>
          <p><strong>Khoa:</strong> {studentInfo.khoa}</p>
          <p><strong>Lớp:</strong> {studentInfo.lop}</p>
          <p><strong>Ngày Sinh:</strong> {studentInfo.ngaysinh}</p>
        </div>
      </div>
    </div>
  );
}

export default StudentHome;
