
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EditStudent.css"; // Import file CSS

function EditStudent() {
  const { mssv } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState({
    mssv: "",
    hoten: "",
    lop: "",
    ngaysinh: "",
    khoa: "",
  });

  useEffect(() => {
    console.log("Đang gọi API với MSSV:", mssv);
    fetch(`http://localhost/Home_React_baoanh/backend/get_mssv.php?mssv=${mssv}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Dữ liệu API trả về:", data);
        if (data.success) {
          setStudent(data.student); // Sử dụng đúng object student
        } else {
          alert("Không tìm thấy sinh viên!");
          navigate("/");
        }
      })
      .catch((error) => console.error("Lỗi lấy dữ liệu sinh viên:", error));
  }, [mssv, navigate]);

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    console.log("Dữ liệu gửi đi:", student);

    fetch("http://localhost/Home_React_baoanh/backend/editstudent.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(student),
    })
      .then((res) => res.text()) // Đọc phản hồi dưới dạng text để debug
      .then((text) => {
        console.log("Phản hồi dạng text từ server:", text); // Kiểm tra nội dung trả về
        return JSON.parse(text); // Chuyển đổi về JSON (nếu hợp lệ)
      })
      .then((data) => {
        console.log("Phản hồi JSON từ server:", data);
        if (data.success) {
          alert("Cập nhật thành công!");
          navigate("/");
        } else {
          alert("Cập nhật thất bại: " + data.message);
        }
      })
      .catch((error) => console.error("Lỗi khi cập nhật sinh viên:", error));

  };

  return (
    <div className="edit-student-container">
      <h2>Chỉnh sửa thông tin sinh viên</h2>
      <form className="edit-form">
        <label>MSSV:</label>
        <input type="text" name="mssv" value={student.mssv} disabled />

        <label>Họ Tên:</label>
        <input type="text" name="hoten" value={student.hoten} onChange={handleChange} />

        <label>Lớp:</label>
        <input type="text" name="lop" value={student.lop} onChange={handleChange} />

        <label>Ngày Sinh:</label>
        <input type="date" name="ngaysinh" value={student.ngaysinh} onChange={handleChange} />

        <label>Khoa:</label>
        <input type="text" name="khoa" value={student.khoa} onChange={handleChange} />

        <div className="button-group">
          <button type="button" className="save-btn" onClick={handleUpdate}>
            Lưu
          </button>
          <button type="button" className="cancel-btn" onClick={() => navigate("/")}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditStudent;
