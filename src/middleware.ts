import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Redirect root to /login
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - assets (for images, fonts, etc.)
   */
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
    '/',
  ],
};
