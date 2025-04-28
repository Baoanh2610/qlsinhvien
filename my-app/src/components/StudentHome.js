import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./StudentHome.css";

const StudentHome = () => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchStudentInfo = async (email) => {
    try {
      console.log("Email from localStorage:", email);
      // Giả sử email của sinh viên cũng chính là MSSV
      const mssv = email;

      console.log("Fetching student info with MSSV:", mssv);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/get-student/${mssv}`, {
        withCredentials: true,
      });

      console.log("API Response:", response.data);

      if (response.data.success) {
        console.log("StudentHome: fetched student info =", response.data.student);
        setStudentInfo(response.data.student);
      } else {
        console.error("Không tìm thấy thông tin sinh viên:", response.data.message);
        setError("Không tìm thấy thông tin sinh viên. Vui lòng liên hệ quản trị viên.");
      }
    } catch (error) {
      console.error("Lỗi lấy thông tin sinh viên:", error);
      setError("Lỗi khi tải thông tin sinh viên. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Thêm console.log để theo dõi component mount
    console.log("StudentHome component mounted");

    const userData = localStorage.getItem("user");
    console.log("StudentHome: userData from localStorage =", userData);

    if (!userData) {
      console.log("StudentHome: no userData, redirecting to /login");
      navigate("/login");
      return;
    }

    try {
      const storedUser = JSON.parse(userData);
      console.log("StudentHome: parsed user =", storedUser);

      if (!storedUser || storedUser.role !== "student") {
        console.log("StudentHome: invalid user or role, redirecting to /login");
        navigate("/login");
      } else {
        console.log("StudentHome: valid student user, setting userInfo");
        setUserInfo(storedUser);
        fetchStudentInfo(storedUser.email);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  if (loading) {
    return <div className="loading-container">Đang tải thông tin sinh viên...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <p>Đang chuyển hướng về trang đăng nhập...</p>
      </div>
    );
  }

  if (!studentInfo || !userInfo) {
    return <div className="loading-container">Không có dữ liệu sinh viên.</div>;
  }

  return (
    <div className="student-home">
      <div className="student-container">
        <h1 className="welcome-title">Chào mừng, {studentInfo.hoten}</h1>

        <div className="student-info">
          <p><strong>MSSV:</strong> {studentInfo.mssv}</p>
          <p><strong>Họ và Tên:</strong> {studentInfo.hoten}</p>
          <p><strong>Khoa:</strong> {studentInfo.khoa}</p>
          <p><strong>Lớp:</strong> {studentInfo.lop}</p>
          <p><strong>Ngày Sinh:</strong> {studentInfo.ngaysinh}</p>
        </div>

        <div className="student-menu">
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