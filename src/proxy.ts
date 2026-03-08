import { NextRequest, NextResponse } from 'next/server';

const TEACHER_HOME = '/teacher/timetable';
const STUDENT_HOME = '/student/timetable';
const PUBLIC_PREFIX = ['/login', '/register', '/forgot-password'];

function getHome(role: string | undefined): string {
  return role === 'teacher' ? TEACHER_HOME : STUDENT_HOME;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const isAuthenticated = Boolean(refreshToken);

  // Root redirect
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(isAuthenticated ? getHome(userRole) : '/login', request.url)
    );
  }

  // Redirect authenticated users away from auth pages
  if (PUBLIC_PREFIX.some((p) => pathname.startsWith(p))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(getHome(userRole), request.url));
    }
    return NextResponse.next();
  }

  // Protect teacher / student dashboard routes
  if (pathname.startsWith('/teacher') || pathname.startsWith('/student')) {
    if (!isAuthenticated) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Role enforcement: wrong-role → redirect to correct home
    if (pathname.startsWith('/teacher') && userRole !== 'teacher') {
      return NextResponse.redirect(new URL(STUDENT_HOME, request.url));
    }
    if (pathname.startsWith('/student') && userRole !== 'student') {
      return NextResponse.redirect(new URL(TEACHER_HOME, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
