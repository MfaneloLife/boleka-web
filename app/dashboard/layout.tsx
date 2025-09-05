import DashboardLayout from '@/src/components/layout/DashboardLayout';
import ProtectedRoute from '@/src/components/auth/ProtectedRoute';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}
