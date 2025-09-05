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
      console.log('Attempting to create Firebase user:', { email, name });
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Firebase user created:', result.user.uid);
      
      // Update user profile with name
      if (result.user) {
        try {
          await updateProfile(result.user, { displayName: name });
          console.log('User profile updated with name');
          
          // Create user profile in your database
          try {
            console.log('Creating user profile in database');
            const response = await fetch('/api/auth/create-user-profile', {
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
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error('API error creating user profile:', errorData);
              throw new Error(`Failed to create user profile: ${errorData.error || response.statusText}`);
            }
            
            const data = await response.json();
            console.log('User profile created successfully:', data);
          } catch (apiError) {
            console.error('Error creating user profile in database:', apiError);
            // Continue - the user is created in Firebase, we can try to create the profile later
          }
        } catch (profileError) {
          console.error('Error updating Firebase profile:', profileError);
          // Continue - we have the Firebase user
        }
      }
      
      return result.user;
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Failed to create account";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email already in use";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address";
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
        try {
          const response = await fetch('/api/auth/create-user-profile', {
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
          
          if (!response.ok) {
            console.error('Failed to create profile for Google user:', await response.text());
          }
        } catch (apiError) {
          console.error('Error creating profile for Google user:', apiError);
        }
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
        try {
          const response = await fetch('/api/auth/create-user-profile', {
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
          
          if (!response.ok) {
            console.error('Failed to create profile for Facebook user:', await response.text());
          }
        } catch (apiError) {
          console.error('Error creating profile for Facebook user:', apiError);
        }
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
