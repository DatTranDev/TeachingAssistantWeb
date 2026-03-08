import { apiClient } from './client';
import type { Subject, ClassSession, User } from '@/types/domain';

export interface TopAbsentStudent {
  studentId: string;
  totalAbsences: number;
  user: Pick<User, '_id' | 'name' | 'email' | 'avatar'>;
}

export interface CreateSubjectPayload {
  hostId: string;
  name: string;
  code: string;
  maxAbsences?: number;
  sessions?: Array<{
    room: string;
    dayOfWeek: number;
    start: string;
    end: string;
  }>;
}

export const subjectsApi = {
  getByUserId: async (userId: string): Promise<Subject[]> => {
    const { data } = await apiClient.get<{ subjects: Subject[] }>(
      `/subject/findByUserId/${userId}`
    );
    return data.subjects;
  },

  getById: async (id: string): Promise<{ subject: Subject; classSessions: ClassSession[] }> => {
    const { data } = await apiClient.get<{ subject: Subject; classSessions: ClassSession[] }>(
      `/subject/${id}`
    );
    return data;
  },

  create: async (payload: CreateSubjectPayload): Promise<Subject> => {
    const { data } = await apiClient.post<{ subject: Subject }>('/subject/add', payload);
    return data.subject;
  },

  join: async (payload: { studentId: string; joinCode: string }): Promise<void> => {
    await apiClient.post('/subject/join', payload);
  },

  leave: async (payload: { studentId: string; subjectId: string }): Promise<void> => {
    await apiClient.post('/subject/leave', payload);
  },

  update: async (id: string, payload: Partial<Subject>): Promise<void> => {
    await apiClient.patch(`/subject/update/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/subject/delete/${id}`);
  },

  getStudents: async (subjectId: string): Promise<User[]> => {
    const { data } = await apiClient.get<{ students: User[] }>(`/subject/${subjectId}/students`);
    return data.students;
  },

  getAvgReview: async (subjectId: string): Promise<unknown> => {
    const { data } = await apiClient.get(`/subject/avgReview/${subjectId}`);
    return data;
  },

  getTopAbsentees: async (subjectId: string, top = 10): Promise<TopAbsentStudent[]> => {
    const { data } = await apiClient.get<{ topAbsentStudents: TopAbsentStudent[] }>(
      `/subject/top-absentees/${subjectId}`,
      { params: { top } }
    );
    return data.topAbsentStudents;
  },

  notifyCancelClass: async (payload: {
    subjectId: string;
    date: string;
    reason?: string;
  }): Promise<void> => {
    await apiClient.post('/subject/notify/classCancel', payload);
  },

  notifyReschedule: async (payload: { subjectId: string; date: string }): Promise<void> => {
    await apiClient.post('/subject/notify/classReschedule', payload);
  },

  exportStudentList: async (subjectId: string): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(`/subject/${subjectId}/students/exportExcel`, {
      responseType: 'blob',
    });
    return data;
  },
};
