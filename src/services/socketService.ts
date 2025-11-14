import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<Socket> {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
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
        console.log('✅ Socket connected:', this.socket?.id);
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

  joinTournamentChat(tournamentId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_tournament_chat', tournamentId);
      console.log(`Joined tournament chat: ${tournamentId}`);
    }
  }

  leaveTournamentChat(tournamentId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_tournament_chat', tournamentId);
      console.log(`Left tournament chat: ${tournamentId}`);
    }
  }

  onNewMessage(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  offNewMessage(): void {
    if (this.socket) {
      this.socket.off('new_message');
    }
  }

  onMessageUpdated(callback: (message: any) => void): void {
    if (this.socket) {
      this.socket.on('message_updated', callback);
    }
  }

  offMessageUpdated(): void {
    if (this.socket) {
      this.socket.off('message_updated');
    }
  }

  onMessageDeleted(callback: (data: { messageId: string }) => void): void {
    if (this.socket) {
      this.socket.on('message_deleted', callback);
    }
  }

  offMessageDeleted(): void {
    if (this.socket) {
      this.socket.off('message_deleted');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket service disconnected');
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isSocketConnected(): boolean {
    return this.isConnected;
  }
}

export default new SocketService();
