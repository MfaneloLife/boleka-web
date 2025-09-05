"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { useEffect } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return <>{children}</>;
}
