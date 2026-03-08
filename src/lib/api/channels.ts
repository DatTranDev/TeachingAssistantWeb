import { apiClient } from './client';
import type { Channel, Post } from '@/types/domain';

export const channelsApi = {
  getBySubject: async (subjectId: string): Promise<Channel[]> => {
    const { data } = await apiClient.get<{ channels: Channel[] }>(
      `/channel/findBySubject/${subjectId}`
    );
    return data.channels;
  },

  create: async (payload: { subjectId: string; name: string }): Promise<Channel> => {
    const { data } = await apiClient.post<{ channel: Channel }>('/channel/add', payload);
    return data.channel;
  },

  update: async (id: string, name: string): Promise<void> => {
    await apiClient.patch(`/channel/update/${id}`, { name });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/channel/delete/${id}`);
  },
};

export const postsApi = {
  getByChannel: async (channelId: string): Promise<Post[]> => {
    const { data } = await apiClient.get<{ posts: Post[] }>(`/channel/post/find/${channelId}`);
    return data.posts ?? [];
  },

  create: async (payload: {
    channelId: string;
    creator: string;
    title: string;
    content: string;
    images?: string[];
  }): Promise<Post> => {
    const { data } = await apiClient.post<{ post: Post }>('/channel/post/add', payload);
    return data.post;
  },

  update: async (id: string, payload: { content?: string; images?: string[] }): Promise<void> => {
    await apiClient.patch(`/channel/post/update/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/channel/post/delete/${id}`);
  },
};
