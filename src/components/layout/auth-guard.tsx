'use client';

import { useEffect, Suspense, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

const AuthGuardInner = memo(function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user status is resolved

    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (!user && !isAuthPage) {
      router.replace('/login');
    } else if (user && isAuthPage) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router, pathname]);
  
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If we are on an auth page, and we don't have a user yet, show the page (or loader if still loading)
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (!user && isAuthPage) {
    return <>{children}</>;
  }

  // If we have a user, show the children (the dashboard)
  if (user && !isAuthPage) {
    return <>{children}</>;
  }

  // Fallback for redirecting state
  return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
  );
});

export function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>}>
      <AuthGuardInner>{children}</AuthGuardInner>
    </Suspense>
  )
}
