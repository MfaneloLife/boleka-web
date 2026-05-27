'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ReactNode } from 'react';

export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.warn('Clerk publishable key is not configured. Auth features will be limited.');
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey || ''}
      appearance={{
        variables: { colorPrimary: '#f97316' },
      }}
    >
      {children}
    </ClerkProvider>
  );
}