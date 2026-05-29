"use client";

import AppShell from "@/src/components/layout/AppShell";

export default function AppShellClient({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}