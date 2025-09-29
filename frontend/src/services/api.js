import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for anonymous requests (no auth token)
const anonymousApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (currentPassword, newPassword) => 
    api.put('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

// Audit API
export const auditAPI = {
  createAudit: (data) => api.post('/audit', data),
  getAudits: (params) => api.get('/audit', { params }),
  getAuditById: (id) => api.get(`/audit/${id}`),
  deleteAudit: (id) => api.delete(`/audit/${id}`),
  getPublicAudits: (params) => api.get('/audit/public', { params }),
  createBatchAudit: (data) => api.post('/audit/batch', data),
  getAuditHistory: (params) => api.get('/audit/history', { params }),
  exportAuditReport: (id, format) => api.get(`/audit/${id}/export?format=${format}`, { 
    responseType: 'blob' 
  }),
  // Anonymous audit methods (no authentication required)
  createAnonymousAudit: (data) => anonymousApi.post('/audit/anonymousAudit', data),
  getAnonymousAuditById: (id) => anonymousApi.get(`/audit/anonymousAudit/${id}`),
};

// User API
export const userAPI = {
  getDashboard: () => api.get('/user/dashboard'),
  updateSubscription: (data) => api.put('/user/subscription', data),
  getUsageStats: (params) => api.get('/user/usage', { params }),
  deleteAccount: (password) => api.delete('/user/account', { data: { password } }),
  exportUserData: () => api.get('/user/export-data'),
};

// Health API
export const healthAPI = {
  getHealth: () => api.get('/health'),
};

export default api;
