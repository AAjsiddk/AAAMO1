'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// A singleton promise to ensure Firebase initializes only once.
let firebaseInitializationPromise: ReturnType<typeof initializeFirebase> | null = null;

const getFirebaseServices = () => {
    if (typeof window === 'undefined') {
        // On the server, just initialize it.
        return initializeFirebase();
    }
    if (!firebaseInitializationPromise) {
        firebaseInitializationPromise = initializeFirebase();
    }
    return firebaseInitializationPromise;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Initialize Firebase on the client side, but ensure it only happens once.
  const { firebaseApp, auth, firestore } = getFirebaseServices();

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
