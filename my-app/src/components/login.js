// Login.js
import React, { useState } from "react";
import "./login.css";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    mssv: "",
    hoten: "",
    khoa: "",
    lop: "",
    ngaysinh: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!isAdmin && !isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!formData.mssv) newErrors.mssv = "MSSV is required";
      if (!formData.hoten) newErrors.hoten = "Họ tên is required";
      if (!formData.khoa) newErrors.khoa = "Khoa is required";
      if (!formData.lop) newErrors.lop = "Lớp is required";
      if (!formData.ngaysinh) newErrors.ngaysinh = "Ngày sinh is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const url = isAdmin
      ? "http://localhost/Home_React_baoanh/backend/login.php"
      : isLogin
        ? "http://localhost/Home_React_baoanh/backend/login.php"
        : "http://localhost/Home_React_baoanh/backend/register.php";

    const payload = {
      email: formData.email,
      password: formData.password,
      role: isAdmin ? "admin" : "student",
      ...(isAdmin || isLogin
        ? {}
        : {
          mssv: formData.mssv,
          hoten: formData.hoten,
          khoa: formData.khoa,
          lop: formData.lop,
          ngaysinh: formData.ngaysinh,
        }),
    };

    try {
      console.log("Sending to backend:", payload);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Response from backend:", data);

      if (data.success) {
        if (isAdmin || isLogin) {
          localStorage.setItem("user", JSON.stringify(data.user));
          if (data.user.role === "student") {
            window.location.href = "/student/home";
          } else if (data.user.role === "admin") {
            window.location.href = "/home";
          } else {
            alert("Vai trò không hợp lệ!");
          }
        } else {
          alert("Tạo tài khoản thành công!");
          setIsLogin(true);
        }
      } else {
        alert(data.message); // Hiển thị thông báo lỗi từ backend
        setErrors({ general: data.message });
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Đã xảy ra lỗi. Vui lòng thử lại sau.");
      setErrors({ general: "Đã xảy ra lỗi. Vui lòng thử lại sau." });
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      mssv: "",
      hoten: "",
      khoa: "",
      lop: "",
      ngaysinh: "",
    });
  };

  const toggleRole = (role) => {
    setIsAdmin(role === "admin");
    setIsLogin(true);
    setErrors({});
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      mssv: "",
      hoten: "",
      khoa: "",
      lop: "",
      ngaysinh: "",
    });
  };

  return (
    <div className="login-container">
      <div className="shape-top-left"></div>
      <div className="shape-bottom-right"></div>
      <div className="form-container">
        <h1 className="form-title">
          {isAdmin ? "Login Admin" : isLogin ? "Sign In" : "Sign Up"}
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="email"
              placeholder={isAdmin ? "Username" : "Email Address"}
              value={formData.email}
              onChange={handleChange}
              className="input-field"
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
          {!isAdmin && !isLogin && (
            <>
              <div className="input-group">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                />
                {errors.confirmPassword && (
                  <p className="error-text">{errors.confirmPassword}</p>
                )}
              </div>
              <div className="input-group">
                <input
                  type="text"
                  name="mssv"
                  placeholder="MSSV"
                  value={formData.mssv}
                  onChange={handleChange}
                  className="input-field"
                />
                {errors.mssv && <p className="error-text">{errors.mssv}</p>}
              </div>
              <div className="input-group">
                <input
                  type="text"
                  name="hoten"
                  placeholder="Họ tên"
                  value={formData.hoten}
                  onChange={handleChange}
                  className="input-field"
                />
                {errors.hoten && <p className="error-text">{errors.hoten}</p>}
              </div>
              <div className="input-group">
                <input
                  type="text"
                  name="khoa"
                  placeholder="Khoa"
                  value={formData.khoa}
                  onChange={handleChange}
                  className="input-field"
                />
                {errors.khoa && <p className="error-text">{errors.khoa}</p>}
              </div>
              <div className="input-group">
                <input
                  type="text"
                  name="lop"
                  placeholder="Lớp"
                  value={formData.lop}
                  onChange={handleChange}
                  className="input-field"
                />
                {errors.lop && <p className="error-text">{errors.lop}</p>}
              </div>
              <div className="input-group">
                <input
                  type="date"
                  name="ngaysinh"
                  value={formData.ngaysinh}
                  onChange={handleChange}
                  className="input-field"
                />
                {errors.ngaysinh && (
                  <p className="error-text">{errors.ngaysinh}</p>
                )}
              </div>
            </>
          )}
          {isAdmin && (
            <div className="toggle-text">
              <a href="#" className="toggle-link">
                Forget my password
              </a>
            </div>
          )}
          <button type="submit" className="submit-button">
            {isAdmin ? "Login" : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
        {!isAdmin && (
          <div className="toggle-text">
            <p>
              {isLogin ? "Don't have an account? " : "Already Have An Account? "}
              <button onClick={toggleForm} className="toggle-link">
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>
        )}
        <div className="toggle-text">
          <button
            onClick={() => toggleRole("student")}
            className={`toggle-button ${!isAdmin ? "active" : ""}`}
          >
            Student
          </button>
          <button
            onClick={() => toggleRole("admin")}
            className={`toggle-button ${isAdmin ? "active" : ""}`}
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;