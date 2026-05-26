"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk, useSignIn, useSignUp } from '@clerk/nextjs';

interface AuthContextType {
  currentUser: { id?: string; name?: string | null; email?: string | null; image?: string | null } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  logOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
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
  const { isLoaded, isSignedIn, user } = useUser();
  const clerk = useClerk();
  const { isLoaded: signInLoaded, signIn: clerkSignIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp: clerkSignUp, setActive: setSignUpActive } = useSignUp();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded]);

  const currentUser = isSignedIn && user
    ? {
        id: user.id,
        name: user.fullName || user.firstName || user.username || null,
        email: user.primaryEmailAddress?.emailAddress || null,
        image: user.imageUrl || null,
        displayName: user.fullName || user.firstName || 'User',
        photoURL: user.imageUrl || null,
      }
    : null;

  async function handleSignIn(email: string, password: string) {
    try {
      setError(null);
      if (!signInLoaded || !clerkSignIn) {
        throw new Error('Sign in is not ready yet');
      }
      const result = await clerkSignIn.create({
        identifier: email,
        password,
      });
      if (result.status === 'complete' && setSignInActive) {
        await setSignInActive({ session: result.createdSessionId });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Sign in failed');
      throw err;
    }
  }

  async function handleSignUp(email: string, password: string, name: string) {
    try {
      setError(null);
      if (!signUpLoaded || !clerkSignUp) {
        throw new Error('Sign up is not ready yet');
      }
      const result = await clerkSignUp.create({
        emailAddress: email,
        password,
        firstName: name,
      });
      if (result.status === 'complete' && setSignUpActive) {
        await setSignUpActive({ session: result.createdSessionId });
      } else if (result.status === 'missing_requirements') {
        await clerkSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Sign up failed');
      throw err;
    }
  }

  async function handleLogOut() {
    try {
      setError(null);
      await clerk.signOut();
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Sign out failed');
    }
  }

  async function handleSignInWithGoogle() {
    try {
      setError(null);
      await clerk.openSignIn({
        appearance: { variables: { colorPrimary: '#4f46e5' } },
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Google sign in failed');
    }
  }

  async function handleSignInWithFacebook() {
    try {
      setError(null);
      await clerk.openSignIn({
        appearance: { variables: { colorPrimary: '#4f46e5' } },
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Facebook sign in failed');
    }
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    logOut: handleLogOut,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithFacebook: handleSignInWithFacebook,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
