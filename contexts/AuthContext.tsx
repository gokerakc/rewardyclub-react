'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { User, UserType } from '@/types';
import { getUser, createUser, updateUserLoginTime } from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: (userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingUserType, setPendingUserType] = useState<UserType | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Check if user exists in Firestore
          let userData = await getUser(firebaseUser.uid);

          // If user doesn't exist, create new user
          if (!userData) {
            const userType = pendingUserType || 'customer';

            await createUser(firebaseUser.uid, {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Anonymous',
              photoURL: firebaseUser.photoURL || undefined,
              userType,
            });

            userData = await getUser(firebaseUser.uid);
          } else {
            // Update last login time
            await updateUserLoginTime(firebaseUser.uid);
          }

          setUser(userData);
          setPendingUserType(null);
        } catch (error) {
          console.error('Error loading user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [pendingUserType]);

  const loginWithGoogle = async (userType: UserType) => {
    try {
      setLoading(true);
      setPendingUserType(userType);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
      setPendingUserType(null);
      throw new Error('Failed to sign in with Google. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
