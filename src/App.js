import axios from 'axios';

// Cấu hình axios mặc định
axios.defaults.baseURL = 'https://backend-zw3r.onrender.com';
axios.defaults.withCredentials = true;

// Thêm interceptor để xử lý lỗi
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.code === 'ECONNABORTED') {
            return Promise.reject(new Error('Kết nối bị timeout. Vui lòng thử lại sau.'));
        }
        if (!error.response) {
            return Promise.reject(new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet hoặc thử lại sau.'));
        }
        return Promise.reject(error);
    }
); 