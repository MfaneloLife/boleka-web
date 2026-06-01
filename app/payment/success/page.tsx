'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown === 0) {
      if (requestId) {
        router.push(`/messages/${requestId}`);
      } else {
        router.push('/messages');
      }
    }
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, requestId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              Your payment has been processed successfully.
              <br />
              <strong>Split:</strong> 95% to vendor · 5% platform commission.
            </p>
          </div>
          
          {requestId && (
            <p className="text-sm text-gray-600 mb-6">
              Request ID: <span className="font-mono font-medium">#{requestId.slice(-8)}</span>
            </p>
          )}

          <p className="text-sm text-gray-500 mb-4">
            Redirecting to order page in {countdown} seconds...
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={requestId ? `/messages/${requestId}` : '/messages'}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              View Conversation
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
