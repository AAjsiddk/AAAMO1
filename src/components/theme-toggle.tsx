'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export function ThemeToggle() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Set initial theme from localStorage or default to 'dark'
  const [theme, setTheme] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  // Effect to apply the theme to the document and localStorage
  const applyTheme = React.useCallback((themeToApply: string) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(themeToApply);
    localStorage.setItem('theme', themeToApply);
    setTheme(themeToApply);
  }, []);

  // Sync theme from localStorage on initial mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
  }, [applyTheme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);

    // Save theme preference to Firestore for the logged-in user
    if (user && firestore) {
      const userDocRef = doc(firestore, `users/${user.uid}`);
      updateDoc(userDocRef, { themeMode: newTheme }).catch(console.error);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">تبديل السمة</span>
    </Button>
  );
}
