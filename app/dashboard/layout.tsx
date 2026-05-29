import AppShell from '@/src/components/layout/AppShell';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AppShell variant="dashboard">{children}</AppShell>
    </ProtectedRoute>
  );
}
