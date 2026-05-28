'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';

interface AppUser {
  id: string;
  name: string;
  email: string;
  onboardingComplete: boolean;
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const syncUser = async (idToken: string) => {
    try {
      // Send token to backend to sync user, mint session cookie, and get app user data
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/sync`,
        { idToken },
        { withCredentials: true }
      );
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (error) {
      console.error('[AuthContext] Error syncing user:', error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      const idToken = await firebaseUser.getIdToken(true);
      await syncUser(idToken);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        await syncUser(idToken);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      if (auth) {
        await auth.signOut();
      }
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      setFirebaseUser(null);
      router.push('/login');
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
