import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getDashboardPath,
  getSessionCookieName,
  verifySessionToken,
} from '@/lib/auth-edge';

const PUBLIC_PATHS = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/archivo') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (PUBLIC_PATHS.includes(pathname)) {
    if (session && pathname === '/login') {
      return NextResponse.redirect(
        new URL(getDashboardPath(session.rol), request.url)
      );
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(getDashboardPath(session.rol), request.url)
    );
  }

  if (pathname === '/estudiante/nuevo') {
    return NextResponse.redirect(new URL('/estudiante/cap/nuevo', request.url));
  }

  if (pathname.startsWith('/estudiante') && session.rol !== 'estudiante') {
    return NextResponse.redirect(
      new URL(getDashboardPath(session.rol), request.url)
    );
  }

  if (pathname.startsWith('/docente') && session.rol !== 'docente') {
    return NextResponse.redirect(
      new URL(getDashboardPath(session.rol), request.url)
    );
  }

  if (pathname.startsWith('/daar') && session.rol !== 'daar') {
    return NextResponse.redirect(
      new URL(getDashboardPath(session.rol), request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
