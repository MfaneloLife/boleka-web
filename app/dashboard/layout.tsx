import { redirect } from 'next/navigation';
import AppShell from '@/src/components/layout/AppShell';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // /dashboard no longer exists — redirect to My Shop
  if (!children) {
    redirect('/dashboard/items');
  }

  return (
    <ProtectedRoute>
      <AppShell variant="dashboard">{children}</AppShell>
    </ProtectedRoute>
  );
}