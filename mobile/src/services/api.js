import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

  // const API_BASE_URL = 'http://10.0.2.2:5000/api';
  const API_BASE_URL = 'http://192.168.15.7:5000/api';
// const API_BASE_URL = "https://overcritically-telaesthetic-hayley.ngrok-free.dev/api";
// const API_BASE_URL = "https://terese-unconventional-luis.ngrok-free.dev/api";
//  const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["ngrok-skip-browser-warning"] = "true";

    console.log("📤 API Request:", config.method.toUpperCase(), config.url);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (email, password) => api.post("/auth/login", { email, password }),
  getProfile: () => api.get("/auth/profile"),
  registerPushToken: (pushToken) => api.post('/auth/push-token', { pushToken }),
  
  // NEW: Update profile with multipart/form-data support
  updateProfile: async (formData) => {
    const token = await AsyncStorage.getItem("userToken");
    
    console.log('📤 Updating profile...');
    
    return axios({
      method: 'PUT',
      url: `${API_BASE_URL}/auth/profile`,
      data: formData,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
        'ngrok-skip-browser-warning': 'true',
      },
    });
  },
};

export const tournamentAPI = {
  getAll: (params) => api.get("/tournaments", { params }),
  getById: (id) => api.get(`/tournaments/${id}`),
  join: (id) => api.post(`/tournaments/${id}/join`),
};

export const messageAPI = {
  getTournamentMessages: (tournamentId) =>
    api.get(`/messages/tournament/${tournamentId}`),
  sendMessage: (tournamentId, message) =>
    api.post(`/messages/tournament/${tournamentId}`, { message }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

export const withdrawalAPI = {
  createWithdrawal: (data) => {
    console.log('📤 Creating withdrawal request:', {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      accountNumber: data.accountNumber,
      hasPassword: !!data.password
    });
    
    return api.post('/withdrawals', {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      accountNumber: data.accountNumber,
      password: data.password
    });
  },
  getMyWithdrawals: (params) => api.get('/withdrawals/my-withdrawals', { params }),
};

// NEW: Notification API
export const notificationAPI = {
  // Get user notifications
  getUserNotifications: (params = {}) => {
    return api.get('/notifications/user/notifications', { params });
  },

  // Get unread count
  getUnreadCount: () => {
    return api.get('/notifications/user/unread-count');
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    return api.patch(`/notifications/user/notifications/${notificationId}/read`);
  },

  // Mark all as read
  markAllAsRead: () => {
    return api.patch('/notifications/user/notifications/mark-all-read');
  }
};

//  export const SOCKET_URL = "http://10.0.2.2:5000";
  export const SOCKET_URL = 'http://192.168.15.7:5000';
//export const SOCKET_URL = 'https://terese-unconventional-luis.ngrok-free.dev';
// export const SOCKET_URL = "https://overcritically-telaesthetic-hayley.ngrok-free.dev";

// NEW: Export base URL for image paths
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // Remove /api from base URL for image serving
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}${imagePath}`;
};

export default api;