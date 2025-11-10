import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieStore = cookies();

  // Define public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register'];

  // If the path is public, just continue
  if (publicPaths.includes(pathname) || pathname.startsWith('/_next/') || pathname.startsWith('/static/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check for the Firebase auth token cookie, typically set on client-side after login
  // Note: This is a basic check. For production, you'd verify the token's validity.
  const authTokenCookie = cookieStore.get('firebaseIdToken'); // Use a generic name or the actual cookie name your app sets

  if (!authTokenCookie) {
    // If no token, redirect to login
    const loginUrl = new URL('/login', request.url);
    // Store the original path to redirect back after login
    loginUrl.searchParams.set('origin', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If the token exists, let the request proceed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for API routes and static files.
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
