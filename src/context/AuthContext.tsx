import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { Admin } from '../types';

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: { username: string; email: string; password: string; role?: 'admin' }) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminData');

    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);

      const { token: newToken, user: adminData } = response.data;

      localStorage.setItem('adminToken', newToken);
      localStorage.setItem('adminData', JSON.stringify(adminData));

      setToken(newToken);
      setAdmin(adminData);

      return { success: true };
    } catch (error: any) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (data: { username: string; email: string; password: string; role?: 'super_admin' | 'moderator' }) => {
    try {
      const response = await authAPI.register(data);
      const { token: newToken, user: adminData } = response.data;

      localStorage.setItem('adminToken', newToken);
      localStorage.setItem('adminData', JSON.stringify(adminData));

      setToken(newToken);
      setAdmin(adminData);

      return { success: true };
    } catch (error: any) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!admin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
