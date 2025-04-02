// src/App.js
import React from "react";
import 'react-toastify/dist/ReactToastify.css';
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
import Attendance from './components/attendance';
import EditStudent from "./components/EditStudent";
import ProtectedRoute from "./components/ProtectedRoute";
import ClassSessions from "./components/ClassSessions";
import { toast } from 'react-hot-toast';


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

          {/* Protected Routes */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/group-management" element={
            <ProtectedRoute>
              <GroupManagement />
            </ProtectedRoute>
          } />
          <Route path="/addstudent" element={
            <ProtectedRoute>
              <AddStudent />
            </ProtectedRoute>
          } />
          <Route path='/attendance' element={
            <ProtectedRoute>
              <Attendance />
            </ProtectedRoute>
          } />
          <Route path="/editstudent/:mssv" element={
            <ProtectedRoute>
              <EditStudent />
            </ProtectedRoute>
          } />

          <Route path="/class-management" element={
            <ProtectedRoute>
              <ClassSessions />
            </ProtectedRoute>
          } />


          {/* Redirect all other routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/get_sessions.php`);
      // ... existing code ...
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Không thể tải danh sách ca học');
    }
  };

  const fetchStudentsBySession = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/get_students_by_session.php?session_id=${selectedSession}`);
      // ... existing code ...
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Không thể tải danh sách sinh viên');
    }
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <h2>Hệ Thống Điểm Danh</h2>
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

export default App;
