import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// THIS MIDDLEWARE IS CURRENTLY DISABLED TO PREVENT REDIRECTION LOOPS.
// The authentication logic is handled client-side in the respective layouts and pages.

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except for the ones starting with:
   * - api (API routes)
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   */
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
