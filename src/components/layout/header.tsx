'use client';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUser, useAuth } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '...';
    const names = name.split(' ');
    return names
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

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
            {isUserLoading ? (
              <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="ml-2 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">تسجيل الدخول</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">إنشاء حساب</Link>
                </Button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
