import { apiClient } from './client';
import type { AbsenceRequest, AbsenceRequestStatus } from '@/types/domain';

export interface CreateAbsenceRequestPayload {
  studentId: string;
  subjectId: string;
  date: string;
  reason: string;
  proof?: string[];
}

export const absenceRequestsApi = {
  create: async (payload: CreateAbsenceRequestPayload): Promise<AbsenceRequest> => {
    const { data } = await apiClient.post<{ absenceRequest: AbsenceRequest }>(
      '/absence/create',
      payload
    );
    return data.absenceRequest;
  },

  getByStudent: async (subjectId: string): Promise<AbsenceRequest[]> => {
    const { data } = await apiClient.get<{ absenceRequests: AbsenceRequest[] }>(
      `/absence/studentRequest`,
      { params: { subjectId } }
    );
    return data.absenceRequests;
  },

  getBySubject: async (subjectId: string): Promise<AbsenceRequest[]> => {
    const { data } = await apiClient.get<{ absenceRequests: AbsenceRequest[] }>(
      `/absence/teacherRequest`,
      { params: { subjectId } }
    );
    return data.absenceRequests;
  },

  review: async (
    id: string,
    status: Exclude<AbsenceRequestStatus, 'pending'>,
    comment?: string
  ): Promise<void> => {
    await apiClient.patch(`/absence/update/${id}`, { status, comment });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/absence/delete/${id}`);
  },
};
