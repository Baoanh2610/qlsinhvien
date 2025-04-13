const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Kết nối MySQL với cấu hình chi tiết
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000, // 10 seconds
  acquireTimeout: 10000, // 10 seconds
  timeout: 60000, // 60 seconds
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Hàm kết nối với retry logic
function connectWithRetry() {
  const db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error('Lỗi kết nối MySQL:', err);
      console.log('Thử kết nối lại sau 5 giây...');
      setTimeout(connectWithRetry, 5000);
    } else {
      console.log('Kết nối MySQL thành công!');
    }
  });

  // Xử lý lỗi kết nối
  db.on('error', (err) => {
    console.error('Lỗi MySQL:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Kết nối bị mất, thử kết nối lại...');
      connectWithRetry();
    } else {
      throw err;
    }
  });

  return db;
}

const db = connectWithRetry();

// API đăng ký người dùng
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const sql = "INSERT INTO users (email, password) VALUES (?, ?)";
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      res.status(500).json({ message: "Lỗi khi đăng ký" });
    } else {
      res.json({ message: "Đăng ký thành công!" });
    }
  });
});

// API lấy danh sách người dùng
app.get("/register", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      res.status(500).json({ message: "Lỗi khi tải danh sách" });
    } else {
      res.json(results);
    }
  });
});

// API xóa người dùng
app.delete("/register/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) {
      res.status(500).json({ message: "Lỗi khi xóa" });
    } else {
      res.json({ message: "Xóa thành công!" });
    }
  });
});

// API cập nhật thông tin người dùng
app.put("/register/:id", (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;
  db.query(
    "UPDATE users SET email = ?, password = ? WHERE id = ?",
    [email, password, id],
    (err, result) => {
      if (err) {
        res.status(500).json({ message: "Lỗi khi cập nhật" });
      } else {
        res.json({ message: "Cập nhật thành công!" });
      }
    }
  );
});
// API thêm sinh viên
app.post("/add-student", (req, res) => {
  const { mssv, hoten, khoa, lop, ngaysinh } = req.body;

  if (!mssv || !hoten || !khoa || !lop || !ngaysinh) {
    return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin!" });
  }

  const sql =
    "INSERT INTO members (mssv, hoten, khoa, lop, ngaysinh) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [mssv, hoten, khoa, lop, ngaysinh], (err, result) => {
    if (err) {
      console.error("Lỗi khi thêm sinh viên:", err);
      return res.status(500).json({ error: "Lỗi máy chủ!" });
    }
    res.json({ message: "Thêm sinh viên thành công!", id: result.insertId });
  });
});
// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy trên cổng ${PORT}`);
});
