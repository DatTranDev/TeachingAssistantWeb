import { apiClient } from './client';
import type { Discussion } from '@/types/domain';

export interface CreateDiscussionPayload {
  cAttendId: string;
  content: string;
  title?: string;
  images?: string[];
}

export const discussionsApi = {
  create: async (payload: CreateDiscussionPayload): Promise<Discussion> => {
    const { data } = await apiClient.post<{ discussion: Discussion }>('/discussion/add', payload);
    return data.discussion;
  },

  getByCAttend: async (cAttendId: string): Promise<Discussion[]> => {
    const { data } = await apiClient.get<{ discussions: Discussion[] }>(
      `/discussion/findByCAttend/${cAttendId}`
    );
    return data.discussions;
  },

  update: async (id: string, payload: Partial<Discussion>): Promise<void> => {
    await apiClient.patch(`/discussion/update/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/discussion/delete/${id}`);
  },

  vote: async (id: string, type: 'upvote' | 'downvote'): Promise<void> => {
    await apiClient.patch(`/discussion/vote/${id}`, { type });
  },

  resolve: async (id: string): Promise<void> => {
    await apiClient.patch(`/discussion/resolve/${id}`, {});
  },

  reply: async (payload: {
    cAttendId: string;
    replyOf: string;
    content: string;
    images?: string[];
  }): Promise<Discussion> => {
    const { data } = await apiClient.post<{ discussion: Discussion }>('/discussion/reply', payload);
    return data.discussion;
  },
};
