import FirebaseLoginForm from '@/src/components/auth/FirebaseLoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Boleka',
  description: 'Login to your Boleka account or create a new one',
};

interface LoginPageProps {
  searchParams: { redirect?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  // Always redirect to client dashboard after successful authentication
  // This simplifies the flow and avoids URL encoding issues
  const callbackUrl = '/dashboard/client';
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Boleka</h1>
            <p className="text-gray-600 mt-2">Sign in to your account or create a new one</p>
          </div>
          <FirebaseLoginForm callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
