import { apiClient } from './client';
import type { Group, GroupMessage } from '@/types/domain';

export const groupsApi = {
  // Default (manual) groups — scoped to subject
  createDefault: async (payload: { name: string; subjectId: string }): Promise<Group> => {
    const { data } = await apiClient.post<{ group: Group }>('/group/create', {
      ...payload,
      type: 'DEFAULT',
      members: [],
    });
    return data.group;
  },

  getDefaultBySubject: async (subjectId: string): Promise<Group[]> => {
    const { data } = await apiClient.get<{ groups: Group[] }>(`/group/default/all/${subjectId}`);
    return data.groups;
  },

  getMyDefaultGroup: async (subjectId: string): Promise<Group | null> => {
    try {
      const { data } = await apiClient.get<{ group: Group }>(`/group/default/${subjectId}`);
      return data.group;
    } catch {
      return null;
    }
  },

  // Random groups — scoped to cAttend (session)
  createRandom: async (payload: { cAttendId: string; numberOfGroup: number }): Promise<Group[]> => {
    const { data } = await apiClient.post<{ groups: Group[] }>('/group/random/create', payload);
    return data.groups;
  },

  getRandomByCAttend: async (cAttendId: string): Promise<Group[]> => {
    const { data } = await apiClient.get<{ groups: Group[] }>(`/group/random/all/${cAttendId}`);
    return data.groups;
  },

  getMyRandomGroups: async (subjectId: string): Promise<Group[]> => {
    const { data } = await apiClient.get<{ groups: Group[] }>(`/group/random/${subjectId}`);
    return data.groups;
  },

  deleteRandomByCAttend: async (cAttendId: string): Promise<void> => {
    await apiClient.delete(`/group/randoms/${cAttendId}`);
  },

  // Shared operations
  update: async (id: string, payload: { name?: string; members?: string[] }): Promise<Group> => {
    const { data } = await apiClient.patch<{ group: Group }>(`/group/update/${id}`, payload);
    return data.group;
  },

  addMember: async (
    groupId: string,
    userId: string,
    currentMembers: (string | { _id: string })[]
  ): Promise<Group> => {
    const memberIds = currentMembers.map((m) => (typeof m === 'object' ? m._id : m));
    const { data } = await apiClient.patch<{ group: Group }>(`/group/update/${groupId}`, {
      members: [...memberIds, userId],
    });
    return data.group;
  },

  removeMember: async (groupId: string): Promise<void> => {
    await apiClient.delete(`/group/leave/${groupId}`);
  },

  join: async (groupId: string): Promise<void> => {
    await apiClient.post(`/group/join/${groupId}`, {});
  },

  leave: async (groupId: string): Promise<void> => {
    await apiClient.delete(`/group/leave/${groupId}`);
  },

  assignReviewer: async (groupId: string, reviewedByGroupId: string): Promise<void> => {
    await apiClient.patch(`/group/update/${groupId}`, { reviewedBy: reviewedByGroupId });
  },
};

export const groupMessagesApi = {
  create: async (payload: {
    groupId: string;
    senderId: string;
    content: string;
    images?: string[];
  }): Promise<GroupMessage> => {
    const { data } = await apiClient.post<{ groupMessage: GroupMessage }>(
      '/group/message/create',
      payload
    );
    return data.groupMessage;
  },

  getByGroup: async (groupId: string, limit = 50): Promise<GroupMessage[]> => {
    const { data } = await apiClient.get<{ messages: GroupMessage[]; hasMore: boolean }>(
      `/group/${groupId}/message/?limit=${limit}`
    );
    return [...data.messages].reverse(); // reverse to oldest-first for display
  },

  update: async (id: string, content: string): Promise<void> => {
    await apiClient.patch(`/group/message/update/${id}`, { content });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/group/message/delete/${id}`);
  },

  revoke: async (id: string): Promise<void> => {
    await apiClient.patch(`/group/message/update/${id}`, { isRevoked: true });
  },
};
