import { apiClient } from './client';
import type { CAttend, StudentCAttendEntry } from '@/types/domain';

export interface CreateCAttendPayload {
  classSessionId: string;
  date: string;
  teacherGPS?: { latitude: number; longitude: number };
  timeExpired?: number;
}

export const cAttendApi = {
  create: async (payload: CreateCAttendPayload): Promise<CAttend> => {
    const { data } = await apiClient.post<{ cAttend: CAttend }>('/cAttend/add', payload);
    return data.cAttend;
  },

  getById: async (id: string): Promise<CAttend> => {
    const { data } = await apiClient.get<{ cAttend: CAttend }>(`/cAttend/${id}`);
    return data.cAttend;
  },

  getBySubject: async (subjectId: string): Promise<CAttend[]> => {
    const { data } = await apiClient.get<{ cAttends: CAttend[] }>(
      `/cAttend/findBySubject/${subjectId}`
    );
    return data.cAttends;
  },

  update: async (id: string, payload: Partial<CAttend>): Promise<void> => {
    await apiClient.patch(`/cAttend/update/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/cAttend/delete/${id}`);
  },

  activate: async (
    id: string,
    payload?: { teacherGPS?: { latitude: number; longitude: number }; timeExpired?: number }
  ): Promise<void> => {
    await apiClient.patch(`/cAttend/update/${id}`, { isActive: true, ...(payload ?? {}) });
  },

  deactivate: async (id: string): Promise<void> => {
    await apiClient.patch(`/cAttend/update/${id}`, { isActive: false });
  },

  close: async (id: string): Promise<void> => {
    await apiClient.patch(`/cAttend/update/${id}`, { isActive: false, isClosed: true });
  },

  reset: async (id: string): Promise<void> => {
    await apiClient.patch(`/cAttend/reset/${id}`, {});
  },

  getStudents: async (id: string): Promise<StudentCAttendEntry[]> => {
    const { data } = await apiClient.get<{ students: StudentCAttendEntry[] }>(
      `/cAttend/attendStudents/${id}`
    );
    return data.students;
  },
};
