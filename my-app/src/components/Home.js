import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { toast } from 'react-toastify';

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
  const [formData, setFormData] = useState({
    mssv: "",
    hoten: "",
    khoa: "",
    lop: "",
    ngaysinh: "",
  });

  const navigate = useNavigate();

  // Lấy danh sách sinh viên từ server
  const fetchStudents = async () => {
    try {
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

  // Xử lý thay đổi input trong form thêm sinh viên
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Thêm sinh viên
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);

    const trimmedFormData = {
      mssv: formData.mssv.trim(),
      hoten: formData.hoten.trim(),
      khoa: formData.khoa.trim(),
      lop: formData.lop.trim(),
      ngaysinh: formData.ngaysinh.trim(),
    };

    // Kiểm tra chuỗi rỗng
    if (
      trimmedFormData.mssv === "" ||
      trimmedFormData.hoten === "" ||
      trimmedFormData.khoa === "" ||
      trimmedFormData.lop === "" ||
      trimmedFormData.ngaysinh === ""
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin, không để trống!");
      setLoading(false);
      return;
    }

    try {
      console.log('Payload gửi đi:', trimmedFormData);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/add-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify(trimmedFormData),
        credentials: 'include',
      });

      const result = await response.json();
      console.log('Phản hồi từ server:', result);

      if (response.ok) {
        toast.success(result.message || "Thêm sinh viên thành công");
        setFormData({
          mssv: "",
          hoten: "",
          khoa: "",
          lop: "",
          ngaysinh: "",
        });
        setShowAddForm(false);
        fetchStudents();
      } else {
        toast.error(result.error || "Không thể thêm sinh viên");
      }
    } catch (error) {
      console.error("Lỗi khi thêm sinh viên:", error);
      toast.error("Không thể thêm sinh viên: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Xóa sinh viên
  const handleDeleteStudent = async (mssv) => {
    if (window.confirm(`Bạn có chắc muốn xóa sinh viên có MSSV: ${mssv}?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/delete-student`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ mssv }),
          credentials: 'include',
        });

        const result = await response.json();

        if (result.success) {
          setStudents(students.filter((student) => student.mssv !== mssv));
          setFilteredStudents(filteredStudents.filter((student) => student.mssv !== mssv));
          toast.success("Xóa sinh viên thành công");
        } else {
          toast.error(result.message || "Không thể xóa sinh viên");
        }
      } catch (error) {
        console.error("Lỗi khi xóa sinh viên:", error);
        toast.error("Không thể xóa sinh viên. Vui lòng thử lại.");
      }
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
        <button className="add-button" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Ẩn Form" : "Thêm Sinh Viên"}
        </button>
      </div>

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
              maxLength="20"
            />
            <input
              type="text"
              name="hoten"
              placeholder="Họ Tên"
              value={formData.hoten}
              onChange={handleInputChange}
              required
              maxLength="100"
            />
            <input
              type="text"
              name="khoa"
              placeholder="Khoa"
              value={formData.khoa}
              onChange={handleInputChange}
              required
              maxLength="50"
            />
            <input
              type="text"
              name="lop"
              placeholder="Lớp"
              value={formData.lop}
              onChange={handleInputChange}
              required
              maxLength="50"
            />
            <input
              type="date"
              name="ngaysinh"
              value={formData.ngaysinh}
              onChange={handleInputChange}
              required
            />
            <div className="form-buttons">
              <button type="submit" disabled={loading}>
                {loading ? "Đang thêm..." : "Thêm"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}>
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

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
            <tr key={student.mssv}>
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
    </div>
  );
}

export default Home;