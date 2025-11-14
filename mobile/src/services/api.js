import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

//  const API_BASE_URL = 'http://10.0.2.2:5000/api';
  const API_BASE_URL = 'http://10.198.88.149:5000/api';
//const API_BASE_URL = "https://terese-unconventional-luis.ngrok-free.dev/api";
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
      // Don't log password for security
      hasPassword: !!data.password
    });
    
    return api.post('/withdrawals', {
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      accountNumber: data.accountNumber,
      password: data.password  // ← ADDED: Include password in request
    });
  },
  getMyWithdrawals: (params) => api.get('/withdrawals/my-withdrawals', { params }),
};

// export const SOCKET_URL = "http://10.0.2.2:5000";
  export const SOCKET_URL = 'http://10.198.88.149:5000';
//export const SOCKET_URL = 'https://terese-unconventional-luis.ngrok-free.dev';

export default api;