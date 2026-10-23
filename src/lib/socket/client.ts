import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: AppSocket | null = null;

export function getSocket(): AppSocket {
  if (!socketInstance) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';
    socketInstance = io(url, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketInstance.emit = new Proxy(socketInstance.emit, {
      apply(target, socket, args: unknown[]) {
        // All mutations now go through authorized HTTP routes and server publication.
        if (typeof args[0] === 'string' && /^(send|attendace)/.test(args[0])) return socket;
        return Reflect.apply(target, socket, args);
      },
    });
  }
  return socketInstance;
}

export function destroySocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
