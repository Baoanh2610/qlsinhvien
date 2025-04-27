import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./EditStudent.css"; // Import file CSS
import { toast } from 'react-toastify';

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
    fetch(`${process.env.REACT_APP_API_URL}/get-student/${mssv}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Để gửi cookie/session nếu cần
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Dữ liệu API trả về:", data);
        if (data.success) {
          setStudent(data.student);
        } else {
          toast.error(data.message || "Không tìm thấy sinh viên!");
          navigate("/");
        }
      })
      .catch((error) => {
        console.error("Lỗi lấy dữ liệu sinh viên:", error);
        toast.error("Không thể tải thông tin sinh viên. Vui lòng thử lại sau.");
        navigate("/");
      });
  }, [mssv, navigate]);

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    console.log("Dữ liệu gửi đi:", student);

    fetch(`${process.env.REACT_APP_API_URL}/edit-student`, {
      method: "PUT", // Sửa thành PUT để khớp với endpoint trong server.js
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Để gửi cookie/session nếu cần
      body: JSON.stringify(student),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Phản hồi từ server:", data);
        if (data.success) {
          toast.success("Cập nhật thành công!");
          navigate("/");
        } else {
          toast.error(data.message || "Cập nhật thất bại!");
        }
      })
      .catch((error) => {
        console.error("Lỗi khi cập nhật sinh viên:", error);
        toast.error("Không thể cập nhật thông tin sinh viên. Vui lòng thử lại sau.");
      });
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