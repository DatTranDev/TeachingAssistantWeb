import { apiClient } from './client';
import type { Discussion, Reaction } from '@/types/domain';

export interface CreateDiscussionPayload {
  cAttendId: string;
  creator: string;
  content: string;
  title?: string;
  images?: string[];
  replyOf?: string | null;
}

export interface AddReactionPayload {
  userId: string;
  discussionId: string;
  type: 1 | 2 | 3 | 4 | 5;
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
    return data.discussions ?? [];
  },

  update: async (id: string, payload: Partial<Discussion>): Promise<void> => {
    await apiClient.patch(`/discussion/update/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/discussion/delete/${id}`);
  },

  vote: async (id: string, type: 'upvote' | 'downvote'): Promise<void> => {
    await apiClient.post(`/discussion/${id}/vote`, { type });
  },

  addReaction: async (payload: AddReactionPayload): Promise<Reaction> => {
    const { data } = await apiClient.post<{ reaction: Reaction }>(
      '/discussion/reaction/add',
      payload
    );
    return data.reaction;
  },

  updateReaction: async (reactionId: string, type: 1 | 2 | 3 | 4 | 5): Promise<Reaction> => {
    const { data } = await apiClient.patch<Reaction>(`/discussion/reaction/update/${reactionId}`, {
      type,
    });
    return data;
  },
};
