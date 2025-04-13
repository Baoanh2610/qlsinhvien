import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/login', {
                email,
                password,
                role
            });

            if (response.data.success) {
                // Lưu thông tin user vào localStorage
                localStorage.setItem('user', JSON.stringify(response.data.user));
                // Chuyển hướng dựa trên role
                if (response.data.user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/student/dashboard');
                }
            } else {
                setError(response.data.message || 'Đăng nhập thất bại');
            }
        } catch (err) {
            console.error('Lỗi đăng nhập:', err);
            if (err.response) {
                setError(err.response.data.message || 'Đăng nhập thất bại');
            } else if (err.request) {
                setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet hoặc thử lại sau.');
            } else {
                setError('Có lỗi xảy ra. Vui lòng thử lại sau.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Render your form here */}
        </div>
    );
};

export default Login; 