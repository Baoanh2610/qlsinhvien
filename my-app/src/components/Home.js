import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    mssv: "",
    hoten: "",
    khoa: "",
    lop: "",
    ngaysinh: ""
  });

  const navigate = useNavigate();

  // 📌 HÀM LẤY DANH SÁCH SINH VIÊN
  const fetchStudents = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/get-students`
      );
      const data = await response.json();
      if (data.success) {
        setStudents(data.students);
        setFilteredStudents(data.students);
      } else {
        console.error("Lỗi khi lấy dữ liệu:", data.message);
        toast.error("Không thể tải danh sách sinh viên");
      }
    } catch (error) {
      console.error("Lỗi kết nối đến backend:", error);
      toast.error("Không thể kết nối đến server");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 📌 HÀM XÓA SINH VIÊN
  const handleDeleteStudent = async (mssv) => {
    if (window.confirm(`Bạn có chắc muốn xóa sinh viên có MSSV: ${mssv}?`)) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/delete-student`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ mssv }),
            credentials: 'include'
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Response từ server:', result);

        if (result.success) {
          setStudents(students.filter(student => student.mssv !== mssv));
          setFilteredStudents(filteredStudents.filter(student => student.mssv !== mssv));
          toast.success("Xóa sinh viên thành công");
        } else {
          toast.error(result.message || "Không thể xóa sinh viên");
        }
      } catch (error) {
        console.error('Chi tiết lỗi:', {
          message: error.message,
          status: error.status
        });
        toast.error("Không thể xóa sinh viên. Vui lòng thử lại sau.");
      }
    }
  };

  // 📌 HÀM TÌM KIẾM SINH VIÊN THEO THỜI GIAN THỰC
  const handleSearch = (e) => {
    const { name, value } = e.target;
    const newSearch = { ...search, [name]: value };
    setSearch(newSearch);

    // Nếu tất cả các trường tìm kiếm đều trống, trả về danh sách gốc
    if (Object.values(newSearch).every(val => val === "")) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      const matchMSSV = newSearch.mssv === "" || student.mssv.toLowerCase().includes(newSearch.mssv.toLowerCase());
      const matchHoTen = newSearch.hoten === "" || student.hoten.toLowerCase().includes(newSearch.hoten.toLowerCase());
      const matchLop = newSearch.lop === "" || student.lop.toLowerCase().includes(newSearch.lop.toLowerCase());

      return matchMSSV && matchHoTen && matchLop;
    });

    setFilteredStudents(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Kiểm tra dữ liệu trước khi gửi
    if (!formData.mssv || !formData.hoten || !formData.khoa || !formData.lop || !formData.ngaysinh) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      setLoading(false);
      return;
    }

    try {
      console.log('Đang gửi request thêm sinh viên:', formData);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/add-student`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(formData),
          credentials: 'include'
        }
      );

      const result = await response.json();
      console.log('Response từ server:', result);

      if (response.ok) {
        toast.success(result.message || "Thêm sinh viên thành công");
        setShowAddForm(false);
        setFormData({
          mssv: "",
          hoten: "",
          khoa: "",
          lop: "",
          ngaysinh: ""
        });
        fetchStudents();
      } else {
        throw new Error(result.error || "Không thể thêm sinh viên");
      }
    } catch (error) {
      console.error('Chi tiết lỗi:', error);
      toast.error(error.message || "Không thể thêm sinh viên");
    } finally {
      setLoading(false);
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
        <button className="add-button" onClick={() => navigate("/addstudent")}>
          Thêm Sinh Viên
        </button>
      </div>

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
          {filteredStudents.map((student, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{student.mssv}</td>
              <td>{student.hoten}</td>
              <td>{student.khoa}</td>
              <td>{student.lop}</td>
              <td>{student.ngaysinh}</td>
              <td className="action-buttons">
                <button
                  className="delete-button"
                  onClick={() => handleDeleteStudent(student.mssv)}
                >
                  Xóa
                </button>
                <button
                  className="edit-button"
                  onClick={() => navigate(`/editstudent/${student.mssv}`)}
                >
                  Sửa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showAddForm && (
        <div className="add-form">
          <h3>Thêm sinh viên mới</h3>
          <form onSubmit={handleAddStudent}>
            <input
              type="text"
              name="mssv"
              placeholder="MSSV"
              value={formData.mssv}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="hoten"
              placeholder="Họ tên"
              value={formData.hoten}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="khoa"
              placeholder="Khoa"
              value={formData.khoa}
              onChange={handleInputChange}
              required
            />
            <input
              type="text"
              name="lop"
              placeholder="Lớp"
              value={formData.lop}
              onChange={handleInputChange}
              required
            />
            <input
              type="date"
              name="ngaysinh"
              value={formData.ngaysinh}
              onChange={handleInputChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Đang thêm..." : "Thêm"}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)}>
              Hủy
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Home;