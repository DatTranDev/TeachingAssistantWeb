import { apiClient } from './client';
import type { Document } from '@/types/domain';

export const documentsApi = {
  getByCAttend: async (cAttendId: string): Promise<Document[]> => {
    const { data } = await apiClient.get<{ documents: Document[] }>(
      `/document/findByCAttend/${cAttendId}`
    );
    return data.documents;
  },

  upload: async (
    file: File,
    params: { name: string; type: string; cAttendId: string },
    onProgress?: (pct: number) => void
  ): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<{ document: Document }>(
      `/upload/file?name=${encodeURIComponent(params.name)}&type=${encodeURIComponent(params.type)}&cAttendId=${params.cAttendId}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (event.total) onProgress?.(Math.round((event.loaded * 100) / event.total));
        },
      }
    );
    return data.document;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/document/delete/${id}`);
  },
};
