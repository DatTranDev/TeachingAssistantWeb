'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket, destroySocket, type AppSocket } from '@/lib/socket/client';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import { refreshSession } from '@/lib/api/client';
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
export function SocketProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string | null;
}) {
  const token = useAuthStore((state) => state.accessToken);
  const [connection, setConnection] = useState<{ socket: AppSocket; token: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    if (!userId || !token) return;
    const socket = getSocket();
    socket.auth = { token };
    let disposed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const recover = async ({ code }: { code?: string }) => {
      if (disposed) return;
      if (code === 'AUTH_UNAVAILABLE') {
        retry = setTimeout(() => {
          if (!disposed) socket.connect();
        }, 5000);
        return;
      }
      if (code !== 'TOKEN_EXPIRED') {
        useAuthStore.getState().signOut();
        void fetch('/api/auth/logout', { method: 'POST' });
        return;
      }
      try {
        await refreshSession();
      } catch (error) {
        if (disposed) return;
        if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
          useAuthStore.getState().signOut();
          void fetch('/api/auth/logout', { method: 'POST' });
        } else
          retry = setTimeout(() => {
            if (!disposed) void recover({ code: 'TOKEN_EXPIRED' });
          }, 5000);
      }
    };
    const connected = () => {
      setConnection({ socket, token });
      setIsConnected(true);
    };
    const disconnected = (reason: string) => {
      setIsConnected(false);
      if (reason === 'io server disconnect')
        retry = setTimeout(() => {
          if (!disposed) socket.connect();
        }, 1000);
    };
    socket.on('connect', connected);
    socket.on('disconnect', disconnected);
    socket.on('auth_error', recover);
    socket.on('connect_error', (error: Error & { data?: { code?: string } }) => {
      void recover(error.data ?? { code: 'AUTH_UNAVAILABLE' });
    });
    socket.connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      socket.off('connect', connected);
      socket.off('disconnect', disconnected);
      socket.off('auth_error', recover);
      socket.off('connect_error');
      destroySocket();
    };
  }, [token, userId]);
  return (
    <SocketContext.Provider
      value={{
        socket: userId && connection?.token === token ? connection.socket : null,
        isConnected: !!userId && connection?.token === token && isConnected,
        onlineUsers: [],
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
export function useSocket() {
  return useContext(SocketContext);
}
