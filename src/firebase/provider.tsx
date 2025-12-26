'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect, Suspense } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Auth, User } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useUser as useUserHook } from './auth/use-user'; // Renaming to avoid conflict
import type { UserSettings } from '@/lib/types';

// --- Context and Types ---

export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  userSettings: UserSettings | null;
  setUserSettings: React.Dispatch<React.SetStateAction<UserSettings | null>>;
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
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  
  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp,
      firestore,
      auth,
      userSettings,
      setUserSettings,
    };
  }, [firebaseApp, firestore, auth, userSettings]);

  return (
    <FirebaseContext.Provider value={contextValue}>
       <Suspense fallback={null}>
         <ThemeLoader />
         <SettingsLoader />
       </Suspense>
       <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

function SettingsLoader() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { setUserSettings } = useFirebaseServices();

    useEffect(() => {
        if (user && firestore) {
            const userDocRef = doc(firestore, 'users', user.uid);
            const unsub = onSnapshot(userDocRef, (userDoc) => {
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const settings: UserSettings = {
                        sidebarOrder: data.sidebarOrder || [],
                        pinnedItems: data.pinnedItems || [],
                    };
                    setUserSettings(settings);
                } else {
                     setUserSettings({ sidebarOrder: [], pinnedItems: [] });
                }
            });
            return () => unsub();
        } else {
            setUserSettings(null);
        }
    }, [user, firestore, setUserSettings]);

    return null;
}

/**
 * A client component responsible for loading and applying the user's theme
 * from Firestore after they have been authenticated.
 */
function ThemeLoader() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    // This effect runs only on the client
    if (user && firestore) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsub = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
           if (userData.theme) {
             const { primary, background, accent } = userData.theme;
             if (primary) document.documentElement.style.setProperty('--primary', primary);
             if (background) document.documentElement.style.setProperty('--background', background);
             if (accent) document.documentElement.style.setProperty('--accent', accent);
           }
        }
      });
      return () => unsub(); // Cleanup listener on unmount
    }
  }, [user, firestore]);

  return null; // This component doesn't render anything
}
