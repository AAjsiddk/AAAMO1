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
      <div className="flex min-h-screen w-full flex-row-reverse relative z-10 bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            <AuthGuard>{children}</AuthGuard>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
