import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    baseURL: 'http://localhost:8080/api/v1',
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const adminService = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    getStats: () => api.get('/admin/stats'),
    getUsers: () => api.get('/admin/users'),
    getTransactions: () => api.get('/admin/transactions'),
    getStations: () => api.get('/stations'),
};

export default api;
