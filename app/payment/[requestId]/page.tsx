"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import PaymentForm from '@/src/components/PaymentForm';
import TermsAndConditions from '@/src/components/TermsAndConditions';
import Loading from '@/src/components/Loading';

export default function PaymentPage({ params }: { params: { requestId: string } }) {
  const { requestId } = params;
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  const [request, setRequest] = useState<{
    id: string;
    status: string;
    endDate?: string;
    item: {
      id: string;
      title: string;
      price: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const intendedUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect_url=${encodeURIComponent(intendedUrl)}`);
      return;
    }

    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/requests/${requestId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch request details');
        }
        const data = await response.json();
        setRequest(data);
      } catch (error) {
        console.error('Error fetching request:', error);
        setError('Failed to load request details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequest();
    }
  }, [requestId, router, isLoaded, isSignedIn]);

  const handleCancel = () => {
    router.back();
  };

  if (!isLoaded || loading) {
    return <Loading />;
  }

  if (!isSignedIn) {
    return null;
  }

  if (error || !request) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error || 'Request not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
        {showPaymentForm ? 'Complete Your Payment' : 'Review Terms and Conditions'}
      </h1>
      {showPaymentForm ? (
        <PaymentForm
          requestId={requestId}
          amount={request.item.price}
          itemName={request.item.title}
          onCancel={handleCancel}
        />
      ) : (
        <TermsAndConditions
          itemName={request.item.title}
          returnDate={request.endDate ? new Date(request.endDate).toLocaleDateString() : undefined}
          onAccept={() => setShowPaymentForm(true)}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}