import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { AppState } from 'react-native';
import { setupPushNotifications } from '../services/notificationService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollingIntervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (user && token) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [user, token]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (user && token) {
          updateUser();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription?.remove();
    };
  }, [user, token]);

  const startPolling = () => {
    stopPolling(); 
    
    pollingIntervalRef.current = setInterval(() => {
      updateUserSilently();
    }, 10000); 
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Setup push notifications for already logged in user
        setupPushNotifications().catch(error => {
          console.error('Failed to setup push notifications on app load:', error);
        });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { token: newToken, user: userData } = response.data;

      await AsyncStorage.setItem('userToken', newToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      // Setup push notifications after successful login
      setupPushNotifications().catch(error => {
        console.error('Failed to setup push notifications:', error);
      });

      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register({ ...data, role: 'player' });
      const { token: newToken, user: userData } = response.data;

      await AsyncStorage.setItem('userToken', newToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      // Setup push notifications after successful registration
      setupPushNotifications().catch(error => {
        console.error('Failed to setup push notifications:', error);
      });

      return { success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = async () => {
    try {
      stopPolling();
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data.user;
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  const updateUserSilently = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data.user;
      
      if (user && userData.coinBalance !== user.coinBalance) {
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error) {
      console.error('Error in silent update:', error);
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  // NEW: Update user profile after editing
  const updateUserProfile = async (updatedUser) => {
    try {
      // Update user in state
      setUser(updatedUser);
      // Update user in AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        updateUserProfile, // NEW: Added this function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};