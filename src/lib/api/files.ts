import { apiClient } from './client';
import { UserFile } from '@/types/domain';

export const filesApi = {
  upload: async (file: File, name?: string): Promise<{ message: string; file: UserFile }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);

    const { data } = await apiClient.post<{ message: string; file: UserFile }>(
      '/file-storage',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  getAll: async (): Promise<UserFile[]> => {
    const { data } = await apiClient.get<UserFile[]>('/file-storage');
    return data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<{ message: string }>(`/file-storage/${id}`);
    return data;
  },
};
