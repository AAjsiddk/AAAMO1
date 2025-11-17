'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase'
import { doc, updateDoc } from 'firebase/firestore'

export function ThemeToggle() {
  const [theme, setTheme] = React.useState('dark');
  const { user } = useUser();
  const firestore = useFirestore();

  // Effect to load theme from localStorage on initial mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else {
      setTheme('dark'); // Default to dark
    }
  }, []);

  // Effect to apply theme to the document and save to localStorage
  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light'); 
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
    
    // Also save theme preference to Firestore if user is logged in
    if(user && firestore) {
        const userDocRef = doc(firestore, `users/${user.uid}`);
        updateDoc(userDocRef, { theme: theme }).catch(console.error);
    }

  }, [theme, user, firestore]);
  
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">تبديل السمة</span>
    </Button>
  );
}
