import { apiClient } from './client';
import type { AttendRecord, AttendanceStatus } from '@/types/domain';

export const attendRecordsApi = {
  checkIn: async (payload: {
    cAttendId: string;
    studentId: string;
    studentLatitude: number;
    studentLongitude: number;
    FCMToken?: string;
    index?: number;
  }): Promise<AttendRecord> => {
    const { data } = await apiClient.post<{ attendRecord: AttendRecord }>(
      '/cAttend/attendRecord/add',
      payload
    );
    return data.attendRecord;
  },

  getByCAttend: async (cAttendId: string): Promise<AttendRecord[]> => {
    const { data } = await apiClient.get<{ attendRecords: AttendRecord[] }>(
      `/cAttend/attendRecord/findByCAttend/${cAttendId}`
    );
    return data.attendRecords;
  },

  // Teacher: add a record for a student who hasn't checked in
  addForStudent: async (payload: {
    cAttendId: string;
    studentId: string;
    status: AttendanceStatus;
    index?: number;
  }): Promise<AttendRecord> => {
    const { data } = await apiClient.post<{ attendRecord: AttendRecord }>(
      '/cAttend/attendRecord/add/forStudent',
      payload
    );
    return data.attendRecord;
  },

  // Teacher: update an existing record
  updateForStudent: async (
    id: string,
    payload: {
      status: AttendanceStatus;
      index?: number;
    }
  ): Promise<AttendRecord> => {
    const { data } = await apiClient.patch<{ attendRecord: AttendRecord }>(
      `/cAttend/attendRecord/update/forStudent/${id}`,
      payload
    );
    return data.attendRecord;
  },

  markExcusedAttendance: async (payload: {
    subjectId: string;
    cAttendId: string;
    date: string;
  }): Promise<void> => {
    await apiClient.patch('/cAttend/attendRecord/markExcusedAttendance', payload);
  },

  getByUserAndSubject: async (subjectId: string, userId: string): Promise<AttendRecord[]> => {
    const { data } = await apiClient.get<{ attendRecords: AttendRecord[] }>(
      `/subject/${subjectId}/user/${userId}/attendRecords`
    );
    return data.attendRecords;
  },

  updateAcceptedNumber: async (cAttendId: string, acceptedNumber: number): Promise<void> => {
    await apiClient.patch(`/cAttend/attendRecord/updateAcceptedNumber`, {
      cAttendId,
      acceptedNumber,
    });
  },
};
