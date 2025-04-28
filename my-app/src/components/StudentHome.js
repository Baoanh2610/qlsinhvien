
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./StudentHome.css";

const StudentHome = () => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  const fetchStudentInfo = async (email) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-student-by-email`, {
        params: { email },
        withCredentials: true,
      });
      if (response.data.success) {
        console.debug("StudentHome: fetched student info =", response.data.student);
        setStudentInfo(response.data.student);
      } else {
        console.error("Không tìm thấy thông tin sinh viên:", response.data.message);
        alert("Không tìm thấy thông tin sinh viên. Vui lòng liên hệ quản trị viên.");
        navigate("/login");
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin sinh viên:", error);
      alert("Lỗi khi tải thông tin sinh viên. Vui lòng thử lại sau.");
      navigate("/login");
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    console.debug("StudentHome: userData =", userData);
    if (!userData) {
      console.debug("StudentHome: no userData, redirecting to /login");
      navigate("/login");
      return;
    }
    try {
      const storedUser = JSON.parse(userData);
      console.debug("StudentHome: parsed user =", storedUser);
      if (!storedUser || storedUser.role !== "student") {
        console.debug("StudentHome: invalid user or role, redirecting to /login");
        navigate("/login");
      } else {
        setUserInfo(storedUser);
        fetchStudentInfo(storedUser.email);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  if (!studentInfo || !userInfo) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="student-home-container">
      <div className="student-home-content">
        <h2>Chào mừng, {studentInfo.hoten}</h2>
        <div className="student-info">
          <p><strong>MSSV:</strong> {studentInfo.mssv}</p>
          <p><strong>Họ và Tên:</strong> {studentInfo.hoten}</p>
          <p><strong>Khoa:</strong> {studentInfo.khoa}</p>
          <p><strong>Lớp:</strong> {studentInfo.lop}</p>
          <p><strong>Ngày Sinh:</strong> {studentInfo.ngaysinh}</p>
        </div>
        <div className="student-links">
          <ul>
            <li><Link to="/student-home">Trang chủ</Link></li>
            <li><Link to="/student/profile">Thông tin cá nhân</Link></li>
            <li><Link to="/student/attendance">Kết quả điểm danh</Link></li>
            <li><Link to="/student/group">Nhóm</Link></li>
            <li><Link to="/student/schedule">Ca học</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentHome;