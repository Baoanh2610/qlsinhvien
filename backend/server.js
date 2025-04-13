const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
require('dotenv').config();

const app = express();

// Cấu hình CORS
app.use(cors({
  origin: 'https://qlsinhvien-git-master-baoanhs-projects.vercel.app/', // Thay đổi thành URL frontend của bạn
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(cookieParser());

// Cấu hình session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: true,
    sameSite: 'none',
    maxAge: 24 * 60 * 60 * 1000 // 1 ngày
  }
}));

// Kết nối MySQL với cấu hình chi tiết
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 17714,
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.DB_CA_CERT
  },
  connectTimeout: 60000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Hàm kết nối với retry logic
function connectWithRetry(retryCount = 0) {
  const maxRetries = 5;

  const db = mysql.createConnection(dbConfig);

  db.connect((err) => {
    if (err) {
      console.error('Lỗi kết nối MySQL:', err);
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Thử kết nối lại sau ${delay / 1000} giây... (Lần thử: ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => connectWithRetry(retryCount + 1), delay);
      } else {
        console.error('Đã thử kết nối quá số lần cho phép. Vui lòng kiểm tra cấu hình database.');
      }
    } else {
      console.log('Kết nối MySQL thành công!');
    }
  });

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
  const { email, password, role } = req.body;
  const sql = "INSERT INTO users (email, password, role) VALUES (?, ?, ?)";
  db.query(sql, [email, password, role], (err, result) => {
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

  const sql = "INSERT INTO students (mssv, hoten, khoa, lop, ngaysinh) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [mssv, hoten, khoa, lop, ngaysinh], (err, result) => {
    if (err) {
      console.error("Lỗi khi thêm sinh viên:", err);
      return res.status(500).json({ error: "Lỗi máy chủ!" });
    }
    res.json({ message: "Thêm sinh viên thành công!", id: result.insertId });
  });
});

// API đăng nhập
app.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập đầy đủ thông tin"
    });
  }

  // Kiểm tra thông tin đăng nhập
  const sql = "SELECT * FROM users WHERE email = ? AND password = ? AND role = ?";
  db.query(sql, [email, password, role], (err, results) => {
    if (err) {
      console.error("Lỗi khi đăng nhập:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng"
      });
    }

    const user = results[0];

    // Lưu thông tin user vào session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  });
});

// API kiểm tra đăng nhập
app.get("/check-auth", (req, res) => {
  if (req.session.user) {
    res.json({
      success: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Chưa đăng nhập"
    });
  }
});

// API đăng xuất
app.post("/logout", (req, res) => {
  req.session.destroy();
  res.json({
    success: true,
    message: "Đăng xuất thành công"
  });
});

// API lấy danh sách sinh viên
app.get("/get-students", (req, res) => {
  const sql = "SELECT * FROM students";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy danh sách sinh viên:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
    res.json({
      success: true,
      students: results
    });
  });
});

// API lấy thông tin sinh viên theo MSSV
app.get("/get-student/:mssv", (req, res) => {
  const { mssv } = req.params;
  const sql = "SELECT * FROM students WHERE mssv = ?";
  db.query(sql, [mssv], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy thông tin sinh viên:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên"
      });
    }
    res.json({
      success: true,
      student: results[0]
    });
  });
});

// API cập nhật thông tin sinh viên
app.put("/edit-student", (req, res) => {
  const { mssv, hoten, khoa, lop, ngaysinh } = req.body;
  const sql = "UPDATE students SET hoten = ?, khoa = ?, lop = ?, ngaysinh = ? WHERE mssv = ?";
  db.query(sql, [hoten, khoa, lop, ngaysinh, mssv], (err, result) => {
    if (err) {
      console.error("Lỗi khi cập nhật thông tin sinh viên:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
    res.json({
      success: true,
      message: "Cập nhật thông tin thành công"
    });
  });
});

// API xóa sinh viên
app.delete("/delete-student", (req, res) => {
  const { mssv } = req.body;
  const sql = "DELETE FROM students WHERE mssv = ?";
  db.query(sql, [mssv], (err, result) => {
    if (err) {
      console.error("Lỗi khi xóa sinh viên:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
    res.json({
      success: true,
      message: "Xóa sinh viên thành công"
    });
  });
});

// API quản lý ca học
app.get("/class-sessions", (req, res) => {
  const sql = "SELECT * FROM class_sessions ORDER BY date DESC, time_slot ASC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy danh sách ca học:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
    res.json({
      success: true,
      sessions: results
    });
  });
});

app.post("/class-sessions", (req, res) => {
  const { date, time_slot, room, students } = req.body;
  const sql = "INSERT INTO class_sessions (date, time_slot, room) VALUES (?, ?, ?)";
  db.query(sql, [date, time_slot, room], (err, result) => {
    if (err) {
      console.error("Lỗi khi thêm ca học:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
    const sessionId = result.insertId;

    // Thêm sinh viên vào ca học
    if (students && students.length > 0) {
      const values = students.map(mssv => [sessionId, mssv]);
      const enrollSql = "INSERT INTO session_enrollments (session_id, mssv) VALUES ?";
      db.query(enrollSql, [values], (err) => {
        if (err) {
          console.error("Lỗi khi thêm sinh viên vào ca học:", err);
        }
      });
    }

    res.json({
      success: true,
      message: "Thêm ca học thành công",
      sessionId: sessionId
    });
  });
});

// API quản lý nhóm
app.get("/get-groups", (req, res) => {
  const sql = "SELECT g.*, COUNT(gm.mssv) as member_count FROM student_groups g LEFT JOIN group_members gm ON g.id = gm.group_id GROUP BY g.id";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy danh sách nhóm:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
    res.json({
      success: true,
      groups: results
    });
  });
});

app.post("/create-group", (req, res) => {
  const { name, session_id, students } = req.body;
  const sql = "INSERT INTO student_groups (name, session_id) VALUES (?, ?)";
  db.query(sql, [name, session_id], (err, result) => {
    if (err) {
      console.error("Lỗi khi tạo nhóm:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
    const groupId = result.insertId;

    // Thêm sinh viên vào nhóm
    if (students && students.length > 0) {
      const values = students.map(mssv => [groupId, mssv]);
      const memberSql = "INSERT INTO group_members (group_id, mssv) VALUES ?";
      db.query(memberSql, [values], (err) => {
        if (err) {
          console.error("Lỗi khi thêm sinh viên vào nhóm:", err);
        }
      });
    }

    res.json({
      success: true,
      message: "Tạo nhóm thành công",
      groupId: groupId
    });
  });
});

// API thông báo
app.get("/get-notifications", (req, res) => {
  const { session_id, student_mssv } = req.query;
  const sql = `
    SELECT n.*, ns.is_read 
    FROM notifications n
    LEFT JOIN notification_status ns ON n.id = ns.notification_id AND ns.mssv = ?
    WHERE n.session_id = ?
    ORDER BY n.created_at DESC
  `;
  db.query(sql, [student_mssv, session_id], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy thông báo:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
    res.json({
      success: true,
      data: results
    });
  });
});

app.post("/mark-notification-read", (req, res) => {
  const { notification_id, student_mssv } = req.body;
  const sql = "INSERT INTO notification_status (notification_id, mssv, is_read) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_read = 1";
  db.query(sql, [notification_id, student_mssv], (err) => {
    if (err) {
      console.error("Lỗi khi đánh dấu đã đọc:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
    res.json({
      success: true,
      message: "Đánh dấu đã đọc thành công"
    });
  });
});

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy trên cổng ${PORT}`);
});
