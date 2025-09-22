'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccess({ searchParams }: { searchParams: { paymentId?: string } }) {
  const router = useRouter();
  const { paymentId } = searchParams;

  useEffect(() => {
    // If no payment ID is provided, redirect to dashboard
    if (!paymentId) {
      setTimeout(() => {
        router.push('/dashboard/client');
      }, 5000);
    }
  }, [paymentId, router]);

  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-green-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully. 
          {paymentId && (
            <span> Your payment reference is: <span className="font-medium">{paymentId}</span></span>
          )}
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
