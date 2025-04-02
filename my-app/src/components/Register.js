import React, { useState, useEffect } from "react";

function UserTable() {
  const [users, setUsers] = useState([]);

  // Gọi API lấy danh sách người dùng
  useEffect(() => {
    fetch("http://localhost:5000/register")
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error("Lỗi tải dữ liệu:", error));
  }, []);

  // Hàm xử lý xóa người dùng
  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa không?")) {
      fetch(`http://localhost:5000/register/${id}`, { method: "DELETE" })
        .then(() => {
          setUsers(users.filter((user) => user.id !== id));
        })
        .catch((error) => console.error("Lỗi xóa dữ liệu:", error));
    }
  };

  return (
    <div>
      <h2>Danh sách người dùng</h2>
      <table border="1" width="100%" style={{ textAlign: "center" }}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Email</th>
            <th>Password</th>
            <th>Quản lý</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id}>
              <td>{index + 1}</td>
              <td>{user.email}</td>
              <td>****</td> {/* Ẩn password */}
              <td>
                <button
                  style={{ backgroundColor: "red", color: "white" }}
                  onClick={() => handleDelete(user.id)}
                >
                  Xóa
                </button>
                <button
                  style={{
                    backgroundColor: "blue",
                    color: "white",
                    marginLeft: "5px",
                  }}
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

export default UserTable;
