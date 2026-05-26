"use client";

import { AuthProvider } from "@/src/context/AuthContext";
import AuthProviderWrapper from "@/src/components/AuthProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviderWrapper>
      <AuthProvider>
        {children}
      </AuthProvider>
    </AuthProviderWrapper>
  );
}