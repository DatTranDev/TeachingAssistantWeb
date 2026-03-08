import { apiClient } from './client';

export const uploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.post<{ image: string }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.image;
  },

  uploadImages: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((f) => formData.append('image', f));
    const { data } = await apiClient.post<{ images: string[] }>('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.images;
  },

  uploadFile: async (file: File): Promise<{ url: string; name: string; type: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ url: string; name: string; type: string }>(
      '/upload/file',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  exportStudentList: async (subjectId: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/file/exportStudentList/${subjectId}`, {
      responseType: 'blob',
    });
    return data as Blob;
  },
};
