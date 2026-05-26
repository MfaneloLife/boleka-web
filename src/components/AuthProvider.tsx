'use client';

import { ClerkProvider } from '@clerk/nextjs';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: { colorPrimary: '#4f46e5' },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
