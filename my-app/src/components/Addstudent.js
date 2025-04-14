import React, { useState } from "react";
import "./AddStudent.css"; // Import file CSS
import { toast } from "react-hot-toast";

function AddStudent() {
  const [student, setStudent] = useState({
    mssv: "",
    hoten: "",
    khoa: "",
    lop: "",
    ngaysinh: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      !student.mssv ||
      !student.hoten ||
      !student.khoa ||
      !student.lop ||
      !student.ngaysinh
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        mssv: student.mssv,
        hoten: student.hoten,
        khoa: student.khoa,
        lop: student.lop,
        ngaysinh: student.ngaysinh
      };

      console.log('Dữ liệu sinh viên trước khi gửi:', requestData);
      console.log('API URL:', `${process.env.REACT_APP_API_URL}/add-student`);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/add-student`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(requestData),
          credentials: 'include'
        }
      );

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        toast.success(result.message || "Thêm sinh viên thành công");
        setStudent({ mssv: "", hoten: "", khoa: "", lop: "", ngaysinh: "" });
      } else {
        throw new Error(result.error || "Không thể thêm sinh viên");
      }
    } catch (error) {
      console.error('Lỗi khi thêm sinh viên:', error);
      toast.error(error.message || "Không thể thêm sinh viên");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-student-container">
      <h2>Thêm Sinh Viên</h2>
      <form onSubmit={handleAddStudent}>
        <input
          type="text"
          name="mssv"
          placeholder="MSSV"
          value={student.mssv}
          onChange={handleChange}
        />
        <input
          type="text"
          name="hoten"
          placeholder="Họ Tên"
          value={student.hoten}
          onChange={handleChange}
        />
        <input
          type="text"
          name="khoa"
          placeholder="Khoa"
          value={student.khoa}
          onChange={handleChange}
        />
        <input
          type="text"
          name="lop"
          placeholder="Lớp"
          value={student.lop}
          onChange={handleChange}
        />
        <input
          type="date"
          name="ngaysinh"
          value={student.ngaysinh}
          onChange={handleChange}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Đang thêm..." : "Thêm"}
        </button>
      </form>
    </div>
  );
}

export default AddStudent;