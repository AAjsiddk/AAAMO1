'use client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Header } from '@/components/layout/header';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center">جاري التحميل...</div>;
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  return (
     <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <main className="flex-1">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
