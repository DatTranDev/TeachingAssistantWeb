'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSocket, destroySocket, type AppSocket } from '@/lib/socket/client';
import type { OnlineUser } from '@/types/socket';

interface SocketContextValue {
  socket: AppSocket | null;
  isConnected: boolean;
  onlineUsers: OnlineUser[];
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
});

interface SocketProviderProps {
  children: React.ReactNode;
  userId?: string | null;
}

export function SocketProvider({ children, userId }: SocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const socketRef = useRef<AppSocket | null>(null);

  const connect = useCallback((uid: string) => {
    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('addOnlineUser', uid);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('getOnlineUsers', (users) => {
      setOnlineUsers(users);
    });
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.off('connect');
      socketRef.current.off('disconnect');
      socketRef.current.off('getOnlineUsers');
    }
    destroySocket();
    socketRef.current = null;
    setIsConnected(false);
    setOnlineUsers([]);
  }, []);

  useEffect(() => {
    if (userId) {
      connect(userId);
    } else {
      disconnect();
    }

    return () => {
      if (!userId) disconnect();
    };
  }, [userId, connect, disconnect]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
