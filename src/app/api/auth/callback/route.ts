import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { User } from '@/types/domain';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
  const { accessToken, refreshToken, user } = body;

  if (!accessToken || !refreshToken || !user) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const cookieStore = await cookies();

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });

  // Non-httpOnly cookie so middleware (Edge) can read user role
  cookieStore.set('user_role', user.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });

  return NextResponse.json({ accessToken, user });
}
