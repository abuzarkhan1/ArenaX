import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { username: string; email: string; password: string; fullName: string; role?: 'admin' | 'player' }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const userAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateStatus: (id: string, accountStatus: string) =>
    api.put(`/users/${id}/status`, { accountStatus }),
  adjustCoins: (id: string, data: any) => api.post(`/users/${id}/coins`, data),
  getStats: () => api.get('/users/stats'),
};

export const tournamentAPI = {
  getAll: (params?: any) => api.get('/tournaments', { params }),
  getById: (id: string) => api.get(`/tournaments/${id}`),
  create: (data: any) => api.post('/tournaments', data),
  update: (id: string, data: any) => api.put(`/tournaments/${id}`, data),
  updateStatus: (id: string, status: string, rejectionReason?: string) =>
    api.put(`/tournaments/${id}/status`, { status, rejectionReason }),
  verifyResult: (data: any) => api.post('/tournaments/verify-result', data),
  delete: (id: string) => api.delete(`/tournaments/${id}`),
  removeParticipant: (tournamentId: string, participantId: string) => 
    api.delete(`/tournaments/${tournamentId}/participants/${participantId}`),
  getStats: () => api.get('/tournaments/stats'),
};

export const transactionAPI = {
  getAll: (params?: any) => api.get('/transactions/all', { params }),
  getStats: (period?: string) => api.get('/transactions/stats', { params: { period } }),
  getWalletOverview: () => api.get('/transactions/wallet-overview'),
  getUserTransactions: (params?: any) => api.get('/transactions/my-transactions', { params }),
  exportTransactions: (params?: any) => {
    return api.get('/transactions/export', { 
      params, 
      responseType: 'blob' 
    });
  },
  getTrends: (days?: number) => api.get('/transactions/trends', { params: { days } }),
};

export const notificationAPI = {
  create: (data: any) => api.post('/notifications', data),
  getAll: (params?: any) => api.get('/notifications', { params }),
  send: (id: string) => api.post(`/notifications/${id}/send`),
  sendBulk: (data: { title: string; message: string; type?: string }) => api.post('/notifications/send-bulk', data),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  getStats: () => api.get('/notifications/stats'),
};

export const settingsAPI = {
  getAll: (category?: string) => api.get('/settings', { params: { category } }),
  getGrouped: () => api.get('/settings/grouped'),
  getByKey: (key: string) => api.get(`/settings/${key}`),
  update: (key: string, settingValue: any, description?: string) =>
    api.put(`/settings/${key}`, { settingValue, description }),
  bulkUpdate: (settings: Array<{ settingKey: string; settingValue: any }>) =>
    api.post('/settings/bulk', { settings }),
  create: (data: any) => api.post('/settings', data),
  delete: (key: string) => api.delete(`/settings/${key}`),
};

export const messageAPI = {
  getTournamentMessages: (tournamentId: string) => 
    api.get(`/messages/tournament/${tournamentId}`),
  sendMessage: (tournamentId: string, message: string) => 
    api.post(`/messages/tournament/${tournamentId}`, { message }),
  updateMessage: (messageId: string, message: string) => 
    api.put(`/messages/${messageId}`, { message }),
  deleteMessage: (messageId: string) => 
    api.delete(`/messages/${messageId}`),
};

// ✅ FIXED: Added transactionId parameter
export const withdrawalAPI = {
  getAll: (params?: any) => api.get('/withdrawals/all', { params }),
  updateStatus: (id: string, status: string, adminNote?: string, transactionId?: string) =>
    api.patch(`/withdrawals/${id}`, { 
      status, 
      adminNote: adminNote || '', 
      transactionId: transactionId || '' 
    }),
};

export const adminNotificationAPI = {
  getAll: (params?: any) => api.get('/admin-notifications', { params }),
  getCount: () => api.get('/admin-notifications/count'),
  markAsRead: (id: string) => api.patch(`/admin-notifications/${id}/read`),
  markAllAsRead: () => api.patch('/admin-notifications/read-all'),
};

export const bannerAPI = {
  getAll: (params?: any) => api.get('/banners', { params }),
  getById: (id: string) => api.get(`/banners/${id}`),
  create: (formData: FormData) => api.post('/banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id: string, formData: FormData) => api.put(`/banners/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  toggleStatus: (id: string) => api.patch(`/banners/${id}/toggle`),
  delete: (id: string) => api.delete(`/banners/${id}`),
};

export const reportsAPI = {
  getComprehensive: (period?: string) => api.get('/reports/comprehensive', { params: { period } }),
  exportReport: (type: string, period?: string) => {
    const params = new URLSearchParams({ type, period: period || 'month' });
    return api.get(`/reports/export?${params.toString()}`, { responseType: 'blob' });
  },
};

export default api;