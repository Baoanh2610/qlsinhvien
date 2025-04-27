const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
require('dotenv').config();

const app = express();

// Cấu hình CORS
app.use(cors({
  origin: ['https://qlsinhvien-ecru.vercel.app/', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
  maxAge: 600
}));

app.options('*', cors());

app.use(bodyParser.json());

// Middleware để chuyển đổi tên trường
app.use((req, res, next) => {
  if (req.body) {
    // Chuyển đổi hoTen thành hoten và ngaySinh thành ngaysinh
    if (req.body.hoTen) {
      req.body.hoten = req.body.hoTen;
      delete req.body.hoTen;
    }
    if (req.body.ngaySinh) {
      req.body.ngaysinh = req.body.ngaySinh;
      delete req.body.ngaySinh;
    }
  }
  next();
});

app.use(cookieParser());

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

// Cấu hình kết nối MySQL
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 17714,
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

  db.connect(err => {
    if (err) {
      console.error('Lỗi kết nối MySQL:', err);
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Thử kết nối lại sau ${delay / 1000} giây... (Lần thử: ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => connectWithRetry(retryCount + 1), delay);
      } else {
        console.error('Đã thử kết nối quá số lần cho phép.');
      }
    } else {
      console.log('Kết nối MySQL thành công!');
    }
  });

  db.on('error', err => {
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
app.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users (email, password, role) VALUES (?, ?, ?)";
    db.query(sql, [email, hashedPassword, role], (err, result) => {
      if (err) {
        console.error("Lỗi khi đăng ký:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi khi đăng ký"
        });
      }
      res.json({
        success: true,
        message: "Đăng ký thành công!"
      });
    });
  } catch (error) {
    console.error("Lỗi khi mã hóa mật khẩu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ"
    });
  }
});

// API lấy danh sách người dùng
app.get("/register", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy danh sách người dùng:", err);
      return res.status(500).json({ message: "Lỗi khi tải danh sách" });
    }
    res.json(results);
  });
});

// API xóa người dùng
app.delete("/register/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM users WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Lỗi khi xóa người dùng:", err);
      return res.status(500).json({ message: "Lỗi khi xóa" });
    }
    res.json({ message: "Xóa thành công!" });
  });
});

// API cập nhật người dùng
app.put("/register/:id", async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;

  try {
    let hashedPassword = password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    db.query(
      "UPDATE users SET email = ?, password = ? WHERE id = ?",
      [email, hashedPassword, id],
      (err, result) => {
        if (err) {
          console.error("Lỗi khi cập nhật người dùng:", err);
          return res.status(500).json({
            success: false,
            message: "Lỗi khi cập nhật"
          });
        }
        res.json({
          success: true,
          message: "Cập nhật thành công!"
        });
      }
    );
  } catch (error) {
    console.error("Lỗi khi mã hóa mật khẩu:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ"
    });
  }
});

// API thêm sinh viên
app.post("/add-student", (req, res) => {
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);

  const { mssv, hoten, khoa, lop, ngaysinh } = req.body;

  if (!mssv || !hoten || !khoa || !lop || !ngaysinh) {
    const missingFields = {
      mssv: !mssv,
      hoten: !hoten,
      khoa: !khoa,
      lop: !lop,
      ngaysinh: !ngaysinh,
    };
    console.log('Missing fields:', missingFields);
    return res.status(400).json({
      error: "Vui lòng nhập đầy đủ thông tin!",
      missingFields,
    });
  }

  const sql = "INSERT INTO students (mssv, hoten, khoa, lop, ngaysinh) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [mssv, hoten, khoa, lop, ngaysinh], (err, result) => {
    if (err) {
      console.error("Lỗi khi thêm sinh viên:", err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "MSSV đã tồn tại!" });
      }
      return res.status(500).json({ error: "Lỗi máy chủ!", details: err.message });
    }
    console.log('Insert result:', result);
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

  const sql = "SELECT * FROM users WHERE email = ? AND role = ?";
  db.query(sql, [email, role], async (err, results) => {
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
        message: "Email hoặc vai trò không đúng"
      });
    }

    const user = results[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password.replace('$2y$', '$2a$'));
      if (isMatch) {
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
      } else {
        res.status(401).json({
          success: false,
          message: "Mật khẩu không đúng"
        });
      }
    } catch (error) {
      console.error("Lỗi khi so sánh mật khẩu:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }
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
app.post("/delete-student", (req, res) => {
  const { mssv } = req.body;
  if (!mssv) {
    return res.status(400).json({ error: "MSSV là bắt buộc" });
  }

  const query = "DELETE FROM students WHERE mssv = ?";
  db.query(query, [mssv], (err, result) => {
    if (err) {
      console.error("Lỗi khi xóa sinh viên:", err);
      return res.status(500).json({ error: "Lỗi khi xóa sinh viên" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy sinh viên" });
    }
    res.json({ message: "Xóa sinh viên thành công" });
  });
});

// API lấy danh sách sinh viên theo ca học
app.get("/get-students-by-session", (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin session_id"
    });
  }

  const sql = `
    SELECT s.* 
    FROM students s
    INNER JOIN class_session_students css ON s.mssv = css.mssv
    WHERE css.session_id = ?
    ORDER BY s.hoten ASC
  `;

  db.query(sql, [session_id], (err, results) => {
    if (err) {
      console.error(`Lỗi khi lấy sinh viên cho session ${session_id}:`, err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }

    console.log(`Kết quả sinh viên cho session ${session_id}:`, results);
    res.json({
      success: true,
      data: {
        students: results
      }
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

    // Chuyển đổi kết quả thành mảng
    const sessionsArray = results.map(session => ({
      ...session,
      date: new Date(session.date).toISOString().split('T')[0],
      created_at: new Date(session.created_at).toLocaleString()
    }));

    console.log("Danh sách ca học:", sessionsArray);
    res.json({
      success: true,
      sessions: sessionsArray  // Đảm bảo luôn trả về mảng
    });
  });
});

app.post("/class-sessions", (req, res) => {
  const { date, time_slot, room, students } = req.body;

  if (!date || !time_slot || !room) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin ca học"
    });
  }

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

    if (students && students.length > 0) {
      const values = students.map(mssv => [sessionId, mssv]);
      const enrollSql = "INSERT INTO class_session_students (session_id, mssv) VALUES ?";
      db.query(enrollSql, [values], err => {
        if (err) {
          console.error("Lỗi khi thêm sinh viên vào ca học:", err);
        }
      });
    }

    res.json({
      success: true,
      message: "Thêm ca học thành công",
      sessionId
    });
  });
});

app.put("/class-sessions", (req, res) => {
  const { id, students } = req.body;

  if (!id || !Array.isArray(students)) {
    return res.status(400).json({
      success: false,
      message: "Thiếu id hoặc danh sách sinh viên không hợp lệ"
    });
  }

  db.query("DELETE FROM class_session_students WHERE session_id = ?", [id], err => {
    if (err) {
      console.error("Lỗi khi xóa sinh viên khỏi ca học:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }

    if (students.length > 0) {
      const values = students.map(mssv => [id, mssv]);
      const enrollSql = "INSERT INTO class_session_students (session_id, mssv) VALUES ?";
      db.query(enrollSql, [values], err => {
        if (err) {
          console.error("Lỗi khi thêm sinh viên vào ca học:", err);
          return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ"
          });
        }
        res.json({
          success: true,
          message: "Cập nhật ca học thành công"
        });
      });
    } else {
      res.json({
        success: true,
        message: "Cập nhật ca học thành công"
      });
    }
  });
});

app.delete("/class-sessions", (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Thiếu id"
    });
  }

  db.query("DELETE FROM class_session_students WHERE session_id = ?", [id], err => {
    if (err) {
      console.error("Lỗi khi xóa sinh viên khỏi ca học:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }

    db.query("DELETE FROM class_sessions WHERE id = ?", [id], err => {
      if (err) {
        console.error("Lỗi khi xóa ca học:", err);
        return res.status(500).json({
          success: false,
          message: "Lỗi máy chủ"
        });
      }
      res.json({
        success: true,
        message: "Xóa ca học thành công"
      });
    });
  });
});

// API lấy danh sách sinh viên chưa được phân ca học
app.get("/get-unassigned-students", (req, res) => {
  const sql = `
    SELECT s.* 
    FROM students s
    LEFT JOIN class_session_students css ON s.mssv = css.mssv
    WHERE css.mssv IS NULL
    ORDER BY s.hoten ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy danh sách sinh viên chưa phân ca:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }

    console.log("Sinh viên chưa phân ca:", results);
    res.json({
      success: true,
      students: results
    });
  });
});

// API lấy danh sách sinh viên trong ca học
app.get("/get-session-students", (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin session_id"
    });
  }

  const sql = `
    SELECT s.* 
    FROM students s
    INNER JOIN class_session_students css ON s.mssv = css.mssv
    WHERE css.session_id = ?
    ORDER BY s.hoten ASC
  `;

  db.query(sql, [session_id], (err, results) => {
    if (err) {
      console.error(`Lỗi khi lấy sinh viên cho session ${session_id}:`, err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }

    console.log(`Kết quả sinh viên cho session ${session_id}:`, results);
    res.json({
      success: true,
      students: results
    });
  });
});

// API quản lý nhóm
app.get("/get-groups", (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin session_id"
    });
  }

  const sql = `
    SELECT 
      g.*, 
      COUNT(gm.mssv) as member_count,
      GROUP_CONCAT(s.hoten) as member_names,
      GROUP_CONCAT(s.mssv) as member_mssvs
    FROM student_groups g 
    LEFT JOIN group_members gm ON g.id = gm.group_id
    LEFT JOIN students s ON gm.mssv = s.mssv
    WHERE g.session_id = ?
    GROUP BY g.id
    ORDER BY g.name ASC
  `;

  db.query(sql, [session_id], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy danh sách nhóm:", err);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ"
      });
    }

    const formattedResults = results.map(group => ({
      ...group,
      member_names: group.member_names ? group.member_names.split(',') : [],
      member_mssvs: group.member_mssvs ? group.member_mssvs.split(',') : []
    }));

    res.json({
      success: true,
      groups: formattedResults
    });
  });
});

app.post("/create-group", (req, res) => {
  const { name, session_id, students } = req.body;

  if (!name || !session_id) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin tên nhóm hoặc session_id"
    });
  }

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

    if (students && students.length > 0) {
      const values = students.map(mssv => [groupId, mssv]);
      const memberSql = "INSERT INTO group_members (group_id, mssv) VALUES ?";
      db.query(memberSql, [values], err => {
        if (err) {
          console.error("Lỗi khi thêm sinh viên vào nhóm:", err);
        }
      });
    }

    res.json({
      success: true,
      message: "Tạo nhóm thành công",
      groupId
    });
  });
});

// API thông báo
app.get("/get-notifications", (req, res) => {
  const { session_id, student_mssv } = req.query;

  if (!session_id || !student_mssv) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin session_id hoặc student_mssv"
    });
  }

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

  if (!notification_id || !student_mssv) {
    return res.status(400).json({
      success: false,
      message: "Thiếu thông tin notification_id hoặc student_mssv"
    });
  }

  const sql = `
    INSERT INTO notification_status (notification_id, mssv, is_read) 
    VALUES (?, ?, 1) 
    ON DUPLICATE KEY UPDATE is_read = 1
  `;
  db.query(sql, [notification_id, student_mssv], err => {
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

// API xóa sinh viên khỏi ca học
app.delete('/remove-student-from-session', async (req, res) => {
  const { session_id, mssv } = req.body;
  if (!session_id || !mssv) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin session_id hoặc mssv' });
  }

  try {
    // Xóa sinh viên khỏi bảng class_session_student
    await db.query(
      'DELETE FROM class_session_student WHERE session_id = ? AND mssv = ?',
      [session_id, mssv]
    );

    res.json({ success: true, message: 'Xóa sinh viên khỏi ca học thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa sinh viên khỏi ca học:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa sinh viên khỏi ca học',
      error: error.message
    });
  }
});

// Lấy danh sách sinh viên của một ca học
app.get("/session-students/:id", (req, res) => {
  const sessionId = req.params.id;
  const query = `
    SELECT s.* 
    FROM students s
    JOIN session_students ss ON s.mssv = ss.mssv
    WHERE ss.session_id = ?
  `;

  db.query(query, [sessionId], (err, results) => {
    if (err) {
      console.error("Lỗi khi lấy danh sách sinh viên của ca học:", err);
      return res.status(500).json({ error: "Lỗi khi lấy danh sách sinh viên" });
    }

    res.json({
      success: true,
      students: results || []
    });
  });
});

// Khởi động server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server chạy trên cổng ${PORT}`);
});