import { NextResponse, type NextRequest } from 'next/server';
import { authMiddleware, redirectToLogin } from 'firebase-actions/next/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = ['/', '/login', '/register'];

  // If the path is public, just continue
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // For all other paths, use Firebase Auth middleware
  return authMiddleware(request, {
    loginPath: '/login',
    publicPaths: [], // No additional public paths for the auth middleware itself
    callbacks: {
      // This is called when the user is not authenticated
      onUnauthenticated: () => {
        return redirectToLogin(request, {
          path: '/login',
          // Optionally, you can redirect them back to the page they were trying to access after login
          originPath: pathname, 
        });
      },
      // This is called when the user is authenticated
      onAuthenticated: async ({ token }) => {
        // You can add additional logic here if needed, like checking for custom claims
        return NextResponse.next();
      },
    },
  });
}

export const config = {
  matcher: [
    // Match all paths except for static assets and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
