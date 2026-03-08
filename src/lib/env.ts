import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
  NEXT_PUBLIC_SOCKET_URL: z.string().url('NEXT_PUBLIC_SOCKET_URL must be a valid URL'),
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  REFRESH_TOKEN_COOKIE_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  JWT_SECRET: process.env.JWT_SECRET,
  REFRESH_TOKEN_COOKIE_SECRET: process.env.REFRESH_TOKEN_COOKIE_SECRET,
});

if (!_env.success) {
  const formatted = _env.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`❌ Invalid environment variables:\n${formatted}`);
}

export const env = _env.data;
