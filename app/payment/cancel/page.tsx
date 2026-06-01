'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <XCircleIcon className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          
          <p className="text-sm text-gray-600 mb-6">
            Your payment was cancelled. No charges have been made.
            {requestId && (
              <>
                <br />You can try again from the conversation.
              </>
            )}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {requestId && (
              <Link
                href={`/messages/${requestId}`}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                Return to Conversation
              </Link>
            )}
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

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
}
