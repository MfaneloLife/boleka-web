"use client";

import { AuthProvider } from "@/src/context/AuthContext";
import AuthProviderWrapper from "@/src/components/AuthProvider";
import PWAInstallProvider from "@/src/context/PWAInstallContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviderWrapper>
      <AuthProvider>
        <PWAInstallProvider>
          {children}
        </PWAInstallProvider>
      </AuthProvider>
    </AuthProviderWrapper>
  );
}