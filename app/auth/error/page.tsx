'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [errorMessage, setErrorMessage] = useState('There was a problem with your authentication attempt.');
  
  useEffect(() => {
    if (error) {
      let message = 'An error occurred during authentication';
      
      switch (error) {
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
          message = 'There was a problem with the OAuth provider';
          break;
        case 'EmailCreateAccount':
          message = 'There was a problem creating an account with this email';
          break;
        case 'Callback':
          message = 'There was a problem during the authentication callback';
          break;
        case 'AccessDenied':
          message = 'Access was denied to your account';
          break;
        case 'Default':
        default:
          message = 'An unknown error occurred during authentication';
          break;
      }
      
      setErrorMessage(message);
    }
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
        <p className="mt-2 text-gray-700">
          {errorMessage}
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
