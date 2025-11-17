import { Header } from '@/components/layout/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-row-reverse relative z-10 bg-gradient-to-br from-[#1B1B3A] via-[#2E2A62] to-[#4A3C9A] text-white">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1">
            <AuthGuard>{children}</AuthGuard>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
