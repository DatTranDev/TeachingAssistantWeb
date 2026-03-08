import { apiClient } from './client';
import type { Question } from '@/types/domain';

export const questionsApi = {
  getBySubject: async (subjectId: string): Promise<Question[]> => {
    const { data } = await apiClient.get<{ questions: Question[] }>(
      `/question/findBySubject/${subjectId}`
    );
    return data.questions;
  },

  create: async (payload: {
    subjectId: string;
    studentId: string;
    type: 'text' | 'image';
    content: string;
  }): Promise<Question> => {
    const { data } = await apiClient.post<{ question: Question }>('/question/add', payload);
    return data.question;
  },

  update: async (id: string, payload: Partial<Question>): Promise<void> => {
    await apiClient.patch(`/question/update/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/question/delete/${id}`);
  },

  resolve: async (id: string): Promise<void> => {
    await apiClient.patch(`/question/update/${id}`, { isResolved: true });
  },
};
