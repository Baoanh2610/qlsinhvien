import React, { useState } from "react";
import "./AddStudent.css"; // Import file CSS
import { toast } from "react-hot-toast";

function AddStudent() {
  const [student, setStudent] = useState({
    mssv: "",
    hoTen: "",
    khoa: "",
    lop: "",
    ngaySinh: "",
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
      !student.hoTen ||
      !student.khoa ||
      !student.lop ||
      !student.ngaySinh
    ) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
      setLoading(false);
      return;
    }

    try {
      console.log('Đang gửi request thêm sinh viên:', student);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/add-student`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(student),
          credentials: 'include'
        }
      );

      const result = await response.json();
      console.log('Response từ server:', result);

      if (response.ok) {
        toast.success(result.message || "Thêm sinh viên thành công");
        setStudent({ mssv: "", hoTen: "", khoa: "", lop: "", ngaySinh: "" });
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
          name="hoTen"
          placeholder="Họ Tên"
          value={student.hoTen}
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
          name="ngaySinh"
          value={student.ngaySinh}
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