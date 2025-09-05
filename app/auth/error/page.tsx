import Link from 'next/link';
import { Metadata } from 'next';
import AuthError from '@/src/components/auth/AuthError';

export const metadata: Metadata = {
  title: 'Authentication Error | Boleka',
  description: 'Authentication error occurred',
};

export default function AuthErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <AuthError />
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
        <p className="mt-2 text-gray-700">
          There was a problem with your authentication attempt.
        </p>
        <div className="mt-6 space-y-4">
          <Link 
            href="/auth/login" 
            className="block w-full px-4 py-2 text-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Try logging in again
          </Link>
          <Link 
            href="/" 
            className="block w-full px-4 py-2 text-center text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50"
          >
            Return to home page
          </Link>
        </div>
      </div>
    </div>
  );
}
