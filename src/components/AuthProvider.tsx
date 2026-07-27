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
        variables: {
          colorPrimary: '#f97316',
          colorText: '#1e293b',
          colorTextSecondary: '#64748b',
          colorBackground: '#ffffff',
          colorInputBackground: '#f8fafc',
          colorInputText: '#1e293b',
          borderRadius: '0.75rem',
          fontFamily: 'inherit',
        },
        elements: {
          card: 'shadow-none border-0 p-0',
          headerTitle: 'text-slate-900',
          headerSubtitle: 'text-slate-500',
          socialButtonsBlockButton: 'rounded-xl border-slate-200 hover:bg-slate-50',
          socialButtonsBlockButtonText: 'text-slate-700 font-medium',
          dividerLine: 'bg-slate-200',
          dividerText: 'text-slate-400',
          formFieldInput: 'rounded-xl border-slate-200 focus:border-orange-400 focus:ring-orange-100',
          formButtonPrimary:
            'bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-semibold normal-case',
          footerActionLink: 'text-orange-600 hover:text-orange-700 font-medium',
        },
        layout: {
          socialButtonsPlacement: 'top',
          socialButtonsVariant: 'blockButton',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}