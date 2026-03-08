import { apiClient } from './client';
import type { User } from '@/types/domain';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  data: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  userCode: string;
  school: string;
  role: 'student' | 'teacher';
}

export interface RegisterResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/** Normalized response from the Next.js /api/auth/callback handler */
export interface SessionResult {
  user: User;
  accessToken: string;
}

async function exchangeTokens(
  accessToken: string,
  refreshToken: string,
  user: User
): Promise<SessionResult> {
  const res = await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken, refreshToken, user }),
  });
  if (!res.ok) throw new Error('Token exchange failed');
  return res.json() as Promise<SessionResult>;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<SessionResult> => {
    const { data } = await apiClient.post<LoginResponse>('/user/login', payload);
    return exchangeTokens(data.accessToken, data.refreshToken, data.data);
  },

  register: async (payload: RegisterPayload): Promise<SessionResult> => {
    const { data } = await apiClient.post<RegisterResponse>('/user/register', payload);
    return exchangeTokens(data.accessToken, data.refreshToken, data.user);
  },

  logout: async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  changePassword: async (email: string, password: string): Promise<void> => {
    await apiClient.patch('/user/changepassword', { email, password });
  },

  sendEmailOtp: async (email: string): Promise<void> => {
    await apiClient.post('/service/sendEmail', { email });
  },

  verifyCode: async (email: string, code: string): Promise<void> => {
    await apiClient.post('/service/verifyCode', { email, code });
  },

  verifyEmail: async (email: string): Promise<void> => {
    await apiClient.post('/service/verifyEmail', { email });
  },

  updateProfile: async (
    id: string,
    payload: Partial<Omit<User, '_id' | 'password'>>
  ): Promise<void> => {
    await apiClient.patch(`/user/update/${id}`, payload);
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<{ user: User }>('/user/me');
    return data.user;
  },

  updatePreferences: async (prefs: { language?: string; colorMode?: string }): Promise<User> => {
    const { data } = await apiClient.patch<{ user: User }>('/user/preferences', prefs);
    return data.user;
  },
};
