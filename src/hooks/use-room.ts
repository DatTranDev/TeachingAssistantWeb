'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';

/**
 * Joins a subject Socket.IO room on mount and leaves on unmount.
 */
export function useSubjectRoom(userId: string | undefined, subjectId: string | undefined) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !userId || !subjectId) return;

    socket.emit('joinSubject', { userID: userId, subjectID: subjectId });

    return () => {
      socket.emit('leaveSubject', { userID: userId, subjectID: subjectId });
    };
  }, [socket, userId, subjectId]);
}

/**
 * Joins a subject channel Socket.IO room on mount and leaves on unmount.
 */
export function useChannelRoom(
  userId: string | undefined,
  subjectId: string | undefined,
  channelId: string | undefined
) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !userId || !subjectId || !channelId) return;

    socket.emit('joinSubjectChannel', {
      userID: userId,
      subjectID: subjectId,
      channelID: channelId,
    });

    return () => {
      socket.emit('leaveSubjectChannel', {
        userID: userId,
        subjectID: subjectId,
        channelID: channelId,
      });
    };
  }, [socket, userId, subjectId, channelId]);
}
