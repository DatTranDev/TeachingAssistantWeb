import type { User } from '@/types/domain';

interface JwtPayload {
  userId?: string;
  id?: string;
  role?: 'student' | 'teacher';
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

/**
 * Decode JWT payload client-side (no signature verification — for hydration display only).
 * Returns a partial User; the full User object comes from the login/register API response.
 */
export function decodeUserFromToken(token: string): Partial<User> {
  try {
    const part = token.split('.')[1];
    if (!part) return {};
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
    return {
      _id: payload.userId ?? payload.id ?? '',
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return {};
  }
}
