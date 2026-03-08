'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import type { ServerToClientEvents } from '@/types/socket';

/**
 * Subscribes to a socket event and cleans up the listener on unmount.
 */
export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K]
) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on(event as any, handler as any);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.off(event as any, handler as any);
    };
  }, [socket, event, handler]);
}
