import React, { useState } from "react";
import "./AddStudent.css"; // Import file CSS

function AddStudent() {
  const [student, setStudent] = useState({
    mssv: "",
    hoTen: "",
    khoa: "",
    lop: "",
    ngaySinh: "",
  });

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !student.mssv ||
      !student.hoTen ||
      !student.khoa ||
      !student.lop ||
      !student.ngaySinh
    ) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost/Home_React_baoanh/backend/addstudent.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(student),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert("Thêm sinh viên thành công!"); // Bạn có thể xóa `ID: ${data.id}` vì PHP không trả về ID
        setStudent({ mssv: "", hoTen: "", khoa: "", lop: "", ngaySinh: "" });
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Lỗi khi gửi dữ liệu!");
    }
  };

  return (
    <div className="add-student-container">
      <h2>Thêm Sinh Viên</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="mssv"
          placeholder="MSSV"
          value={student.mssv} // Thêm value để liên kết với state
          onChange={handleChange}
        />
        <input
          type="text"
          name="hoTen"
          placeholder="Họ Tên"
          value={student.hoTen} // Thêm value để liên kết với state
          onChange={handleChange}
        />
        <input
          type="text"
          name="khoa"
          placeholder="Khoa"
          value={student.khoa} // Thêm value để liên kết với state
          onChange={handleChange}
        />
        <input
          type="text"
          name="lop"
          placeholder="Lớp"
          value={student.lop} // Thêm value để liên kết với state
          onChange={handleChange}
        />
        <input
          type="date"
          name="ngaySinh"
          value={student.ngaySinh} // Thêm value để liên kết với state
          onChange={handleChange}
        />
        <button type="submit">Thêm</button>
      </form>
    </div>
  );
}

export default AddStudent;