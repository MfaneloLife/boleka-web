"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/src/context/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <AuthProvider>{children}</AuthProvider>
    </ClerkProvider>
  );
}
