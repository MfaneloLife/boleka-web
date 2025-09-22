"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider, facebookProvider } from '@/src/lib/firebase';
import { ProfileFirestoreService } from '@/src/lib/firestore';

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
    } catch (error: unknown) {
      console.error("Login error:", error);
      let errorMessage = "Failed to sign in";
      if (error instanceof FirebaseError && (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password')) {
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
          
          // Create user profile in Firestore
          try {
            console.log('Creating user profile in Firestore');
            const userProfileResult = await ProfileFirestoreService.createUserProfile(result.user.uid, {
              email: result.user.email,
              name: name,
              photoURL: result.user.photoURL,
              provider: 'email'
            });
            
            if (userProfileResult.success) {
              console.log('User profile created successfully in Firestore');
            } else {
              console.error('Error creating user profile:', userProfileResult.error);
            }
            
            // Automatically create a basic client profile in Firestore
            try {
              console.log('Creating basic client profile in Firestore');
              const clientProfileResult = await ProfileFirestoreService.createClientProfile(result.user.uid, {
                email: result.user.email,
                name: name,
                clientProvince: '',
                clientCity: '',
                clientSuburb: '',
                cellPhone: '',
                preferences: 'Everything',
                profileImageUrl: result.user.photoURL || ''
              });
              
              if (clientProfileResult.success) {
                console.log('Basic client profile created successfully in Firestore');
              } else {
                console.log('Client profile creation will be handled later:', clientProfileResult.error);
              }
            } catch (clientError) {
              console.log('Client profile will be created during profile setup:', clientError);
            }
          } catch (firestoreError) {
            console.error('Error creating profiles in Firestore:', firestoreError);
            // Continue - the user is created in Firebase, we can try to create the profile later
          }
        } catch (profileError) {
          console.error('Error updating Firebase profile:', profileError);
          // Continue - we have the Firebase user
        }
      }
      
      return result.user;
    } catch (error: unknown) {
      console.error("Signup error:", error);
      let errorMessage = "Failed to create account";
      if (error instanceof FirebaseError && error.code === 'auth/email-already-in-use') {
        errorMessage = "Email already in use";
      } else if (error instanceof FirebaseError && error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak";
      } else if (error instanceof FirebaseError && error.code === 'auth/invalid-email') {
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
    } catch (error: unknown) {
      console.error("Logout error:", error);
      setError("Failed to log out");
      throw new Error("Failed to log out");
    }
  }

  async function signInWithGoogle() {
    try {
      setError(null);
      console.log('Starting Google sign-in...');
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', result.user.uid);
      
      // Create or update user profile in Firestore
      if (result.user) {
        try {
          console.log('Creating/updating user profile for Google user in Firestore...');
          const userProfileResult = await ProfileFirestoreService.createUserProfile(result.user.uid, {
            email: result.user.email,
            name: result.user.displayName,
            photoURL: result.user.photoURL,
            provider: 'google'
          });
          
          if (!userProfileResult.success) {
            console.error('Failed to create profile for Google user:', userProfileResult.error);
          } else {
            console.log('User profile created/updated successfully in Firestore');
            
            // Automatically create a basic client profile for new Google users
            try {
              console.log('Creating basic client profile for Google user in Firestore');
              const clientProfileResult = await ProfileFirestoreService.createClientProfile(result.user.uid, {
                email: result.user.email,
                name: result.user.displayName,
                clientProvince: '',
                clientCity: '',
                clientSuburb: '',
                cellPhone: '',
                preferences: 'Everything',
                profileImageUrl: result.user.photoURL || ''
              });
              
              if (clientProfileResult.success) {
                console.log('Basic client profile created successfully for Google user in Firestore');
              } else {
                console.log('Client profile creation will be handled later:', clientProfileResult.error);
              }
            } catch (clientError) {
              console.log('Client profile will be created during profile setup:', clientError);
            }
          }
        } catch (firestoreError) {
          console.error('Error creating profile for Google user in Firestore:', firestoreError);
        }
      }
      
      return result.user;
    } catch (error: unknown) {
      console.error("Google sign-in error:", error);
      let errorMessage = "Failed to sign in with Google";
      
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = "Sign-in was cancelled";
            break;
          case 'auth/popup-blocked':
            errorMessage = "Popup was blocked by browser. Please allow popups and try again";
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = "Sign-in was cancelled";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error. Please check your connection and try again";
            break;
          default:
            errorMessage = `Google sign-in failed: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async function signInWithFacebook() {
    try {
      setError(null);
      const result = await signInWithPopup(auth, facebookProvider);
      
      // Create or update user profile in Firestore
      if (result.user) {
        try {
          const userProfileResult = await ProfileFirestoreService.createUserProfile(result.user.uid, {
            email: result.user.email,
            name: result.user.displayName,
            photoURL: result.user.photoURL,
            provider: 'facebook'
          });
          
          if (!userProfileResult.success) {
            console.error('Failed to create profile for Facebook user:', userProfileResult.error);
          } else {
            console.log('User profile created/updated successfully for Facebook user in Firestore');
            
            // Automatically create a basic client profile for new Facebook users
            try {
              console.log('Creating basic client profile for Facebook user in Firestore');
              const clientProfileResult = await ProfileFirestoreService.createClientProfile(result.user.uid, {
                email: result.user.email,
                name: result.user.displayName,
                clientProvince: '',
                clientCity: '',
                clientSuburb: '',
                cellPhone: '',
                preferences: 'Everything',
                profileImageUrl: result.user.photoURL || ''
              });
              
              if (clientProfileResult.success) {
                console.log('Basic client profile created successfully for Facebook user in Firestore');
              } else {
                console.log('Client profile creation will be handled later:', clientProfileResult.error);
              }
            } catch (clientError) {
              console.log('Client profile will be created during profile setup:', clientError);
            }
          }
        } catch (firestoreError) {
          console.error('Error creating profile for Facebook user in Firestore:', firestoreError);
        }
      }
      
      return result.user;
    } catch (error: unknown) {
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
