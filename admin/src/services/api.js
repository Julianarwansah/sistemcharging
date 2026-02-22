import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
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
    getProfile: () => api.get('/auth/profile'),
    getStats: () => api.get('/admin/stats'),
    getRevenueStats: () => api.get('/admin/revenue-stats'),
    getActiveStations: () => api.get('/admin/active-stations'),
    getNotifications: () => api.get('/admin/notifications'),
    getSettings: () => api.get('/admin/settings'),
    updateSettings: (data) => api.put('/admin/settings', data),
    changePassword: (data) => api.post('/admin/change-password', data),
    getUsers: () => api.get('/admin/users'),
    getCustomers: () => api.get('/admin/customers'),
    getAdmins: () => api.get('/admin/admins'),
    getUserTransactions: (userId) => api.get(`/admin/users/${userId}/transactions`),
    getTransactions: () => api.get('/admin/transactions'),
    getStations: () => api.get('/stations'),
    deleteStation: (id) => api.delete(`/stations/${id}`),
    createStation: (data) => api.post('/stations', data),
    updateStation: (id, data) => api.put(`/stations/${id}`, data),
    getBalance: () => api.get('/wallet/balance'),
    topUp: (amount) => api.post('/wallet/topup', { amount }),
    adminTopUp: (userId, amount) => api.post('/admin/wallet/topup', { user_id: userId, amount }),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    blockUser: (id) => api.post(`/admin/users/${id}/block`),
    unblockUser: (id) => api.post(`/admin/users/${id}/unblock`),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    resetData: () => api.post('/admin/reset'),
    registerAdmin: (data) => api.post('/admin/register', data),
    getActivityLogs: () => api.get('/admin/activity'),
};

export default api;
