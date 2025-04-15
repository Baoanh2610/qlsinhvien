// src/App.js
import React from "react";
import "react-toastify/dist/ReactToastify.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
  Link,
} from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import GroupManagement from "./components/GroupManagement";
import LoginPage from "./components/login";
import Register from "./components/Register";
import AddStudent from "./components/Addstudent";
import Attendance from "./components/attendance";
import EditStudent from "./components/EditStudent";
import StudentHome from "./components/StudentHome";
import StudentProfile from "./components/StudentProfile";
import ClassSessionsNew from "./components/ClassSessionsNew";
import StudentAttendance from "./components/StudentAttendance";
import StudentSchedule from "./components/StudentSchedule";
import StudentGroup from "./components/StudentGroup";
import axios from 'axios';

// Cấu hình axios mặc định
axios.defaults.baseURL = process.env.REACT_APP_API_URL;
axios.defaults.withCredentials = true;

// Thêm interceptor để xử lý lỗi
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Kết nối bị timeout. Vui lòng thử lại sau.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet hoặc thử lại sau.'));
    }
    return Promise.reject(error);
  }
);

// Định nghĩa ProtectedRoute
function ProtectedRoute({ children, allowedRole }) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || (allowedRole && user.role !== allowedRole)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className={isLoginPage ? "login-page-container" : "app-container"}>
      {!isLoginPage && <Sidebar />}
      <div className={isLoginPage ? "full-width" : "content-area"}>
        <Routes>
          {/* Chuyển hướng mặc định đến trang login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes cho admin */}
          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRole="admin">
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/group-management"
            element={
              <ProtectedRoute allowedRole="admin">
                <GroupManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-student"
            element={
              <ProtectedRoute allowedRole="admin">
                <AddStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRole="admin">
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/editstudent/:mssv"
            element={
              <ProtectedRoute allowedRole="admin">
                <EditStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/class-management"
            element={
              <ProtectedRoute allowedRole="admin">
                <ClassSessionsNew />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes cho student */}
          <Route
            path="/student/home"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/schedule"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/group"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentGroup />
              </ProtectedRoute>
            }
          />

          {/* Redirect all other routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Nếu không có user hoặc đang ở trang login, không hiển thị sidebar
  if (!user) {
    return null;
  }

  // Sidebar cho admin
  if (user.role === "admin") {
    return (
      <div className="sidebar">
        <div className="logo">
          <h2>Quản lý sinh viên</h2>
        </div>
        <nav>
          <ul>
            <li>
              <Link to="/home">
                <i className="fas fa-home"></i>
                <span>Trang Chủ</span>
              </Link>
            </li>
            <li>
              <Link to="/group-management">
                <i className="fas fa-users"></i>
                <span>Quản Lý Nhóm</span>
              </Link>
            </li>
            <li>
              <Link to="/class-management">
                <i className="fas fa-chalkboard-teacher"></i>
                <span>Quản Lý Ca Học</span>
              </Link>
            </li>
            <li>
              <Link to="/attendance">
                <i className="fas fa-calendar-check"></i>
                <span>Điểm Danh</span>
              </Link>
            </li>
            <li>
              <Link to="/register">
                <i className="fas fa-user-plus"></i>
                <span>Đăng Ký</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="logout-container">
          <button onClick={handleLogout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i>
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>
    );
  }

  // Sidebar cho student
  if (user.role === "student") {
    return (
      <div className="sidebar">
        <div className="logo">
          <h2>Sinh Viên</h2>
        </div>
        <nav>
          <ul>
            <li>
              <Link to="/student/home">
                <i className="fas fa-home"></i>
                <span>Trang Chủ</span>
              </Link>
            </li>
            <li>
              <Link to="/student/profile">
                <i className="fas fa-user"></i>
                <span>Thông tin cá nhân</span>
              </Link>
            </li>
            <li>
              <Link to="/student/attendance">
                <i className="fas fa-calendar-check"></i>
                <span>Kết quả điểm danh</span>
              </Link>
            </li>
            <li>
              <Link to="/student/group">
                <i className="fas fa-users"></i>
                <span>Nhóm</span>
              </Link>
            </li>
            <li>
              <Link to="/student/schedule">
                <i className="fas fa-clock"></i>
                <span>Ca học</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="logout-container">
          <button onClick={handleLogout} className="logout-button">
            <i className="fas fa-sign-out-alt"></i>
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;