'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [theme, setTheme] = React.useState('dark');
  
  React.useEffect(() => {
    // On mount, check if light mode is preferred and set it.
    const isLight = document.documentElement.classList.contains('dark') || 
                   (localStorage.getItem('theme') === 'light') ||
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: light)').matches);
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('dark'); // dark class in globals.css is actually light mode now
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
