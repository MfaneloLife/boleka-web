'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BankingDetailsForm from '@/components/BankingDetailsForm';
import Loading from '@/components/Loading';

export default function BankingDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [businessProfile, setBusinessProfile] = useState<{
    id: string;
    userId: string;
    businessName: string;
    bankingDetails?: {
      bankName: string;
      accountNumber: string;
      accountType: string;
      branchCode: string;
      accountHolderName: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    const fetchBusinessProfile = async () => {
      try {
        const response = await fetch('/api/business/profile');
        
        if (!response.ok) {
          if (response.status === 404) {
            // User doesn't have a business profile yet
            router.push('/dashboard/business/create-profile');
            return;
          }
          throw new Error('Failed to fetch business profile');
        }
        
        const data = await response.json();
        setBusinessProfile(data);
      } catch (error) {
        console.error('Error fetching business profile:', error);
        setError('Failed to load business profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchBusinessProfile();
    }
  }, [router, status]);

  const handleSuccess = () => {
    // Refresh the page or perform any action after successful update
    setTimeout(() => {
      router.refresh();
    }, 1500);
  };

  if (loading || status === 'loading') {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
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

  if (!businessProfile) {
    return (
      <div className="container mx-auto max-w-md py-12">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Business Profile Found</h2>
          <p className="text-gray-700">You need to create a business profile first.</p>
          <button
            onClick={() => router.push('/dashboard/business/create-profile')}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Create Business Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Banking Details</h1>
      
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Payment Information</h3>
        <p className="text-sm text-blue-700">
          Boleka takes a 5% commission on all rental transactions. When a client pays for your item, 
          95% of the payment will be deposited directly into your bank account within 3-5 business days.
        </p>
      </div>
      
      <BankingDetailsForm
        businessId={businessProfile.id}
        existingDetails={{
          bankName: businessProfile.bankName,
          accountNumber: businessProfile.accountNumber,
          accountType: businessProfile.accountType,
          branchCode: businessProfile.branchCode,
          accountHolderName: businessProfile.accountHolderName,
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
