import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const user = localStorage.getItem('user');

    if (!user) {
        // Nếu không có user trong localStorage, chuyển hướng về trang login
        return <Navigate to="/login" replace />;
    }

    // Nếu có user, render component con
    return children;
};

export default ProtectedRoute; 