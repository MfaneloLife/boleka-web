"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '@/src/lib/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, name: string) => Promise<User>;
  logOut: () => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  signInWithFacebook: () => Promise<User>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Failed to sign in";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password";
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with name
      if (result.user) {
        await updateProfile(result.user, { displayName: name });
        
        // Create user profile in your database
        await fetch('/api/auth/create-user-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            name: name,
          }),
        });
      }
      
      return result.user;
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Failed to create account";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email already in use";
      }
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async function logOut() {
    try {
      setError(null);
      return await signOut(auth);
    } catch (error: any) {
      console.error("Logout error:", error);
      setError("Failed to log out");
      throw new Error("Failed to log out");
    }
  }

  async function signInWithGoogle() {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      
      // Create or update user profile in your database
      if (result.user) {
        await fetch('/api/auth/create-user-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
            photoURL: result.user.photoURL,
            provider: 'google',
          }),
        });
      }
      
      return result.user;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setError("Failed to sign in with Google");
      throw new Error("Failed to sign in with Google");
    }
  }

  async function signInWithFacebook() {
    try {
      setError(null);
      const result = await signInWithPopup(auth, facebookProvider);
      
      // Create or update user profile in your database
      if (result.user) {
        await fetch('/api/auth/create-user-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
            photoURL: result.user.photoURL,
            provider: 'facebook',
          }),
        });
      }
      
      return result.user;
    } catch (error: any) {
      console.error("Facebook sign-in error:", error);
      setError("Failed to sign in with Facebook");
      throw new Error("Failed to sign in with Facebook");
    }
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    signIn,
    signUp,
    logOut,
    signInWithGoogle,
    signInWithFacebook,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
