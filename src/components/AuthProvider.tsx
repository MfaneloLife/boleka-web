'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider as FirebaseAuthProvider } from '@/src/context/AuthContext';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FirebaseAuthProvider>
        {children}
      </FirebaseAuthProvider>
    </SessionProvider>
  );
}
