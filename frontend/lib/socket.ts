import { io, Socket } from 'socket.io-client';
import { Message, Match } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export type SocketEventType =
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'new_message'
  | 'message_read'
  | 'new_match'
  | 'user_typing'
  | 'user_online'
  | 'user_offline';

export interface SocketEvents {
  connect: () => void;
  disconnect: () => void;
  error: (error: Error) => void;
  new_message: (message: Message) => void;
  message_read: (data: { matchId: string; readAt: string }) => void;
  new_match: (match: Match) => void;
  user_typing: (data: { matchId: string; userId: string; isTyping: boolean }) => void;
  user_online: (data: { userId: string }) => void;
  user_offline: (data: { userId: string; lastActive: string }) => void;
}

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<SocketEventType, Set<(...args: unknown[]) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      this.emit('connect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('disconnect');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      this.emit('error', error);
    });

    this.socket.on('new_message', (message: Message) => {
      this.emit('new_message', message);
    });

    this.socket.on('message_read', (data: { matchId: string; readAt: string }) => {
      this.emit('message_read', data);
    });

    this.socket.on('new_match', (match: Match) => {
      this.emit('new_match', match);
    });

    this.socket.on('user_typing', (data: { matchId: string; userId: string; isTyping: boolean }) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_online', (data: { userId: string }) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data: { userId: string; lastActive: string }) => {
      this.emit('user_offline', data);
    });
  }

  private emit(event: SocketEventType, ...args: unknown[]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((listener) => listener(...args));
    }
  }

  on<E extends SocketEventType>(event: E, callback: SocketEvents[E]) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as (...args: unknown[]) => void);

    return () => {
      this.listeners.get(event)?.delete(callback as (...args: unknown[]) => void);
    };
  }

  off<E extends SocketEventType>(event: E, callback?: SocketEvents[E]) {
    if (callback) {
      this.listeners.get(event)?.delete(callback as (...args: unknown[]) => void);
    } else {
      this.listeners.delete(event);
    }
  }

  // Emit events to server
  sendMessage(matchId: string, content: string, type: 'text' | 'image' | 'gif' = 'text') {
    this.socket?.emit('send_message', { matchId, content, type });
  }

  startTyping(matchId: string) {
    this.socket?.emit('typing_start', { matchId });
  }

  stopTyping(matchId: string) {
    this.socket?.emit('typing_stop', { matchId });
  }

  markAsRead(matchId: string) {
    this.socket?.emit('mark_read', { matchId });
  }

  joinMatch(matchId: string) {
    this.socket?.emit('join_match', { matchId });
  }

  leaveMatch(matchId: string) {
    this.socket?.emit('leave_match', { matchId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  get isConnected() {
    return this.socket?.connected ?? false;
  }
}

export const socketClient = new SocketClient();
export default socketClient;
