import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Home.css";
import { toast } from 'react-toastify';
import axios from 'axios';

function Home() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [search, setSearch] = useState({
    mssv: "",
    hoten: "",
    lop: "",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Lấy danh sách sinh viên từ server
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/get-students`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
        setFilteredStudents(data.students);
      } else {
        toast.error("Không thể tải danh sách sinh viên");
      }
    } catch (error) {
      console.error("Lỗi kết nối server:", error);
      toast.error("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Xử lý tìm kiếm sinh viên
  const handleSearch = (e) => {
    const { name, value } = e.target;
    const newSearch = { ...search, [name]: value };
    setSearch(newSearch);

    if (Object.values(newSearch).every((val) => val === "")) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter((student) => {
      const matchMSSV =
        newSearch.mssv === "" ||
        student.mssv.toLowerCase().includes(newSearch.mssv.toLowerCase());
      const matchHoTen =
        newSearch.hoten === "" ||
        student.hoten.toLowerCase().includes(newSearch.hoten.toLowerCase());
      const matchLop =
        newSearch.lop === "" ||
        student.lop.toLowerCase().includes(newSearch.lop.toLowerCase());

      return matchMSSV && matchHoTen && matchLop;
    });

    setFilteredStudents(filtered);
  };

  // Xóa sinh viên
  const handleDeleteStudent = async (mssv) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) {
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/delete-student`, { mssv });

      if (response.data.message) {
        const updatedStudents = students.filter(student => student.mssv !== mssv);
        setStudents(updatedStudents);
        setFilteredStudents(updatedStudents);

        toast.success("Xóa sinh viên thành công!");
      } else {
        throw new Error(response.data.error || "Không thể xóa sinh viên");
      }
    } catch (error) {
      console.error('Lỗi khi xóa sinh viên:', error);
      toast.error(error.response?.data?.error || "Không thể xóa sinh viên");
    }
  };

  return (
    <div className="main-content">
      <h2>Danh sách sinh viên</h2>

      <div className="search-area">
        <input
          type="text"
          name="mssv"
          placeholder="MSSV"
          value={search.mssv}
          onChange={handleSearch}
        />
        <input
          type="text"
          name="hoten"
          placeholder="Họ Tên"
          value={search.hoten}
          onChange={handleSearch}
        />
        <input
          type="text"
          name="lop"
          placeholder="Lớp"
          value={search.lop}
          onChange={handleSearch}
        />
      </div>

      {loading && <div className="loading">Đang tải dữ liệu...</div>}

      <table className="student-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>MSSV</th>
            <th>Họ Tên</th>
            <th>Khoa</th>
            <th>Lớp</th>
            <th>Ngày Sinh</th>
            <th>Quản Lý</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, index) => (
              <tr key={student.mssv}>
                <td>{index + 1}</td>
                <td>{student.mssv}</td>
                <td>{student.hoten}</td>
                <td>{student.khoa}</td>
                <td>{student.lop}</td>
                <td>{student.ngaysinh}</td>
                <td className="action-buttons">
                  <button
                    className="edit-button"
                    onClick={() => navigate(`/editstudent/${student.mssv}`)}
                    disabled={loading}
                  >
                    Sửa
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteStudent(student.mssv)}
                    disabled={loading}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="no-data">
                {loading ? "Đang tải dữ liệu..." : "Không có sinh viên nào"}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="action-buttons">
        <Link to="/group-management" className="group-management-btn">
          Quản Lý Nhóm
        </Link>
      </div>
    </div>
  );
}

export default Home;
