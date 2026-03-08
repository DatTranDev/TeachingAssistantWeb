import { apiClient } from './client';
import type { Notification, NotificationRecipient } from '@/types/domain';

export const notificationsApi = {
  getAll: async (): Promise<NotificationRecipient[]> => {
    const { data } = await apiClient.get<{ notifications: NotificationRecipient[] }>(
      '/notification/get'
    );
    return data.notifications;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notification/read/${id}`, {});
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch('/notification/readAll', {});
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notification/delete/${id}`);
  },
};

export type { Notification, NotificationRecipient };
