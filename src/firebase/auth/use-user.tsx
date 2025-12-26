'use client';
import { useState, useEffect, useContext } from 'react';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseContext } from '@/firebase/provider';

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Global state to cache the user data
let globalUser: User | null = null;
let isLoaded = false;
const listeners = new Set<(user: User | null) => void>();

let authInstance: Auth | null = null;
let unsubscribe: (() => void) | null = null;

function subscribeToAuthChanges(auth: Auth) {
  if (auth === authInstance && unsubscribe) {
    return unsubscribe;
  }
  
  if (unsubscribe) {
    unsubscribe();
  }

  authInstance = auth;
  unsubscribe = onAuthStateChanged(auth, (user) => {
    globalUser = user;
    isLoaded = true;
    listeners.forEach(listener => listener(user));
  }, (error) => {
    console.error("Auth state error:", error);
    isLoaded = true;
    listeners.forEach(listener => listener(null));
  });

  return unsubscribe;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 */
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  const { auth } = context;

  const [user, setUser] = useState<User | null>(globalUser);
  const [isUserLoading, setIsUserLoading] = useState(!isLoaded);
  
  useEffect(() => {
    if (!auth) {
        setIsUserLoading(false);
        setUser(null);
        return;
    }

    // Set initial state from cache
    setUser(globalUser);
    setIsUserLoading(!isLoaded);
    
    // Subscribe to auth changes
    subscribeToAuthChanges(auth);
    
    const listener = (newUser: User | null) => {
      setUser(newUser);
      setIsUserLoading(false);
    };
    
    listeners.add(listener);
    
    return () => {
      listeners.delete(listener);
    };

  }, [auth]);

  return { user, isUserLoading, userError: null };
};
