import DashboardLayout from '@/src/components/layout/DashboardLayout';
import FirebaseProtectedRoute from '@/src/components/auth/FirebaseProtectedRoute';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </FirebaseProtectedRoute>
  );
}
