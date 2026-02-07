'use client';

import { useEffect, useCallback, useState } from 'react';
import socketClient, { SocketEventType, SocketEvents } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';
import { useMatchesStore } from '@/stores/matchesStore';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { initializeSocketListeners } = useMatchesStore();

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        socketClient.connect(token);
        initializeSocketListeners();
      }
    }

    const unsubscribeConnect = socketClient.on('connect', () => {
      setIsConnected(true);
    });

    const unsubscribeDisconnect = socketClient.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
    };
  }, [isAuthenticated, initializeSocketListeners]);

  const subscribe = useCallback(<E extends SocketEventType>(
    event: E,
    callback: SocketEvents[E]
  ) => {
    return socketClient.on(event, callback);
  }, []);

  const unsubscribe = useCallback(<E extends SocketEventType>(
    event: E,
    callback?: SocketEvents[E]
  ) => {
    socketClient.off(event, callback);
  }, []);

  return {
    isConnected,
    subscribe,
    unsubscribe,
    sendMessage: socketClient.sendMessage.bind(socketClient),
    startTyping: socketClient.startTyping.bind(socketClient),
    stopTyping: socketClient.stopTyping.bind(socketClient),
    joinMatch: socketClient.joinMatch.bind(socketClient),
    leaveMatch: socketClient.leaveMatch.bind(socketClient),
  };
}
