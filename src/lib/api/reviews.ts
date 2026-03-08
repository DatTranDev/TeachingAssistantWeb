import { apiClient } from './client';
import type { Review } from '@/types/domain';

export interface CreateReviewPayload {
  studentId: string;
  cAttendId: string;
  /** 1-5 overall teaching quality */
  teachingMethodScore: number;
  /** 1-5 classroom atmosphere */
  atmosphereScore: number;
  /** 1-5 documents quality */
  documentScore: number;
  /** 0-100 percent understood */
  understandPercent: number;
  /** 0-100 percent found useful */
  usefulPercent: number;
  /** Optional comment */
  thinking?: string;
}

export const reviewsApi = {
  create: async (payload: CreateReviewPayload): Promise<Review> => {
    const { data } = await apiClient.post<{ review: Review }>('/review/add', payload);
    return data.review;
  },

  getByCAttend: async (cAttendId: string): Promise<Review[]> => {
    const { data } = await apiClient.get<{ reviews: Review[] }>(
      `/review/findByCAttend/${cAttendId}`
    );
    return data.reviews;
  },

  update: async (id: string, payload: Partial<Review>): Promise<void> => {
    await apiClient.patch(`/review/update/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/review/delete/${id}`);
  },
};
