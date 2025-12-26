'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, Suspense } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, User } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useUser as useUserHook } from './auth/use-user'; // Renaming to avoid conflict

// --- Context and Types ---

export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// --- Hooks ---

/**
 * Hook to access core Firebase services. Throws an error if used outside a FirebaseProvider.
 */
export const useFirebaseServices = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseServices must be used within a FirebaseProvider.');
  }
  return context;
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebaseServices();
  if (!auth) throw new Error("Auth service not available.");
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebaseServices();
  if (!firestore) throw new Error("Firestore service not available.");
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebaseServices();
  if (!firebaseApp) throw new Error("Firebase App not available.");
  return firebaseApp;
};

/**
 * Hook specifically for accessing the authenticated user's state.
 * This is now the primary hook for user data, delegating to useUserHook.
 */
export const useUser = () => {
  return useUserHook();
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

// --- Provider Component ---

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

/**
 * Manages and provides Firebase service instances.
 * User state management is now handled by the useUser hook via onAuthStateChanged.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp,
      firestore,
      auth,
    };
  }, [firebaseApp, firestore, auth]);

  return (
    <FirebaseContext.Provider value={contextValue}>
       <Suspense fallback={null}>
         <ThemeLoader />
       </Suspense>
       <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * A client component responsible for loading and applying the user's theme
 * from Firestore after they have been authenticated.
 */
function ThemeLoader() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
           if (userData.theme) {
             const { primary, background, accent } = userData.theme;
             if (primary) document.documentElement.style.setProperty('--primary', primary);
             if (background) document.documentElement.style.setProperty('--background', background);
             if (accent) document.documentElement.style.setProperty('--accent', accent);
           }
           const themeMode = userData.themeMode || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
           localStorage.setItem('theme', themeMode);
           if (themeMode === 'light') {
             document.documentElement.classList.add('light');
             document.documentElement.classList.remove('dark');
           } else {
             document.documentElement.classList.add('dark');
             document.documentElement.classList.remove('light');
           }
        }
      });
    } else if (!isUserLoading && !user) {
        // Fallback for logged-out users
        const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        if (theme === 'light') {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        }
    }
  }, [user, firestore, isUserLoading]);

  return null; // This component doesn't render anything
}
