import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/token/refresh-token`, {
      headers: { Authorization: `Bearer ${refreshToken}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        cookieStore.delete('refresh_token');
        return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
    }

    const { access_token } = (await response.json()) as { access_token: string };
    return NextResponse.json(
      { accessToken: access_token },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'Network error' }, { status: 500 });
  }
}
