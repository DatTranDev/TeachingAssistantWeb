import { apiClient } from './client';
import type { TimetableNote, ChecklistItem } from '@/types/domain';

export interface CreateNotePayload {
  title: string;
  date: string;
  time?: string;
  duration?: number;
  location?: string;
  doingWith?: string;
  checklist?: Omit<ChecklistItem, '_id'>[];
  done?: boolean;
}

export interface UpdateNotePayload extends Partial<CreateNotePayload> {
  checklist?: ChecklistItem[];
}

export const notesApi = {
  getByUser: async (userId: string): Promise<TimetableNote[]> => {
    const res = await apiClient.get<{ data: TimetableNote[] }>(`/note/user/${userId}`);
    return res.data.data;
  },

  create: async (payload: CreateNotePayload): Promise<TimetableNote> => {
    const res = await apiClient.post<{ data: TimetableNote }>('/note', payload);
    return res.data.data;
  },

  update: async (id: string, payload: UpdateNotePayload): Promise<TimetableNote> => {
    const res = await apiClient.patch<{ data: TimetableNote }>(`/note/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/note/${id}`);
  },
};
