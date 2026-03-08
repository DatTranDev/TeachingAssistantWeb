import { apiClient } from './client';
import type { ClassSession } from '@/types/domain';

export const classSessionsApi = {
  getByUser: async (userId: string): Promise<ClassSession[]> => {
    const { data } = await apiClient.get<{ classSessions: ClassSession[] }>(
      `/classSession/findByUser/${userId}`
    );
    return data.classSessions;
  },

  create: async (payload: Omit<ClassSession, '_id'>): Promise<ClassSession> => {
    const { data } = await apiClient.post<{ classSession: ClassSession }>(
      '/classSession/add',
      payload
    );
    return data.classSession;
  },

  update: async (id: string, payload: Partial<ClassSession>): Promise<void> => {
    await apiClient.patch(`/classSession/update/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/classSession/delete/${id}`);
  },
};
