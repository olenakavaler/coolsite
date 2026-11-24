import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // CSRF: Verify Origin header for state-changing requests to API routes
  if (
    request.nextUrl.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)
  ) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new NextResponse('Forbidden', { status: 403 });
        }
      } catch {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
