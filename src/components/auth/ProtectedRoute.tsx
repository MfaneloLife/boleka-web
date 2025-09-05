"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { useEffect, useState } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (!loading && !currentUser) {
      router.push('/auth/login?redirect=dashboard');
    }
  }, [currentUser, loading, router]);

  // Show nothing during SSR to prevent hydration mismatch
  if (!isClient) {
    return null;
  }

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
