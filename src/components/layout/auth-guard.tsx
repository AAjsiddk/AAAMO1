'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If we're done loading and there's no user, redirect to login
    // unless we are already on the login or register page.
    if (!isUserLoading && !user) {
      if (pathname !== '/login' && pathname !== '/register') {
        router.replace('/login');
      }
    }
  }, [user, isUserLoading, router, pathname]);
  
  // If user data is still loading, show a spinner.
  // Exception: Don't show a spinner for login/register pages to avoid layout shifts.
  if (isUserLoading && pathname !== '/login' && pathname !== '/register') {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mr-4">جاري التحميل...</p>
      </div>
    );
  }

  // If a user exists, or if we are on the public login/register pages,
  // render the children.
  if (user || pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }
  
  // As a final fallback (e.g., waiting for redirect), show a loader.
  return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mr-4">جاري التحميل...</p>
      </div>
  );
}


export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mr-4">جاري التحميل...</p>
      </div>}>
      <AuthGuardInner>{children}</AuthGuardInner>
    </Suspense>
  )
}
