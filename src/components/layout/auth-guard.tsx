'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Loader2 } from 'lucide-react';

function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when loading is complete and there's no user.
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  // While checking user auth, show a loading indicator.
  if (isUserLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mr-4">جاري التحميل...</p>
      </div>
    );
  }

  // If user is authenticated, render the children.
  return <>{children}</>;
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
