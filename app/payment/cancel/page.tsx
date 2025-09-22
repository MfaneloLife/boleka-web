'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentCancel() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard after a delay
    const timeout = setTimeout(() => {
      router.push('/dashboard/client');
    }, 5000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-orange-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
        
        <p className="text-gray-600 mb-6">
          Your payment has been cancelled. No charges have been made to your account.
        </p>
        
        <div className="flex flex-col space-y-3">
          <Link 
            href="/dashboard/requests" 
            className="inline-flex justify-center items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            View My Requests
          </Link>
          
          <Link 
            href="/dashboard/client" 
            className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
