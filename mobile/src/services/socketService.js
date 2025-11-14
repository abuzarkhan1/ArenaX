import { io } from 'socket.io-client';
import { SOCKET_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  async connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        auth: {
          token
        }
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id);
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
      });

      return this.socket;
    } catch (error) {
      console.error('Failed to connect socket:', error);
      throw error;
    }
  }

  joinTournamentChat(tournamentId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_tournament_chat', tournamentId);
      console.log(`Joined tournament chat: ${tournamentId}`);
    }
  }

  leaveTournamentChat(tournamentId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_tournament_chat', tournamentId);
      console.log(`Left tournament chat: ${tournamentId}`);
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  offNewMessage() {
    if (this.socket) {
      this.socket.off('new_message');
    }
  }

  onMessageDeleted(callback) {
    if (this.socket) {
      this.socket.on('message_deleted', callback);
    }
  }

  offMessageDeleted() {
    if (this.socket) {
      this.socket.off('message_deleted');
    }
  }

  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback);
      console.log('✅ Listening for notifications via socket');
    }
  }

  offNotification() {
    if (this.socket) {
      this.socket.off('notification');
      console.log('🔇 Stopped listening for notifications');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket service disconnected');
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
