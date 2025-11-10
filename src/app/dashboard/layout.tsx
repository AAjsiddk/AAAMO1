'use client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Header } from '@/components/layout/header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mr-4">جاري التحميل...</p>
      </div>
    );
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  return (
     <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 bg-background/95">{children}</main>
        </div>
    </SidebarProvider>
  );
}
