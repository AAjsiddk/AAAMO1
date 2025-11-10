import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="flex-1 md:flex-none">
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link
              href="/#features"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              المميزات
            </Link>
            <Link
              href="/#start"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              ابدأ الآن
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost">تسجيل الدخول</Button>
            <Button>إنشاء حساب</Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
