import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieStore = cookies();

  // Define public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register'];

  // If the path is public, just continue
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for the Firebase auth token cookie
  const idTokenCookie = cookieStore.get('firebaseIdToken');

  if (!idTokenCookie) {
    // If no token, redirect to login
    const loginUrl = new URL('/login', request.url);
    // Store the original path to redirect back after login
    loginUrl.searchParams.set('origin', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If the token exists, let the request proceed.
  // The actual token verification will happen on the client-side
  // or in API routes if necessary. The presence of the cookie is a
  // good first-level check for the middleware.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for static assets and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
