import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('refresh_token');
  cookieStore.delete('user_role');
  return NextResponse.json({ success: true });
}
