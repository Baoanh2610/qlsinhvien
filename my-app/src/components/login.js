import React, { useState } from "react";
import "./login.css";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true); // Trạng thái Sign In/Sign Up (dành cho User)
  const [isAdmin, setIsAdmin] = useState(true); // Trạng thái User/Admin
  const [formData, setFormData] = useState({
    email: "", // Dùng email để gửi đến backend
    password: "",
    confirmPassword: "",
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

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: isAdmin ? "admin" : "user",
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (isAdmin || isLogin) {
          // Lưu thông tin đăng nhập
          localStorage.setItem('user', JSON.stringify(data.user));

          // Chuyển hướng về trang home
          window.location.href = "/home";
        } else {
          alert("Tạo tài khoản thành công!");
          setIsLogin(true);
        }
      } else {
        setErrors({ general: data.message });
      }
    } catch (error) {
      console.error("Error:", error);
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
    });
  };

  const toggleRole = (role) => {
    setIsAdmin(role === "admin");
    setIsLogin(true); // Khi chuyển đổi vai trò, mặc định là Sign In
    setErrors({});
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="login-container">
      {/* Shape 1: Top-left */}
      <div className="shape-top-left"></div>

      {/* Shape 2: Bottom-right */}
      <div className="shape-bottom-right"></div>

      {/* Form container */}
      <div className="form-container">
        <h1 className="form-title">
          {isAdmin ? "Login Admin" : isLogin ? "Sign In" : "Sign Up"}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="email"
              placeholder={isAdmin ? "Username" : "Email Address"} // Hiển thị "Username" cho Admin, "Email Address" cho User
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
            onClick={() => toggleRole("user")}
            className={`toggle-button ${!isAdmin ? "active" : ""}`}
          >
            User
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