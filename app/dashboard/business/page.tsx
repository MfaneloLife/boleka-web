'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BusinessProfile {
  id: string;
  businessName: string;
  description: string | null;
  location: string;
  contactPhone: string | null;
}

export default function BusinessDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      // Fetch business profile data
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          setHasBusinessProfile(data.hasBusinessProfile || false);
          setBusinessData(data.businessProfile);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching profile:', err);
          setIsLoading(false);
        });
    }
  }, [status, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hasBusinessProfile) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900">Business Profile Not Set Up</h2>
        <p className="mt-2 text-gray-600">You need to set up your business profile first.</p>
        <div className="mt-6">
          <Link
            href="/auth/profile-setup?type=business"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Set Up Business Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Manage your items and requests from clients
        </p>
      </div>

      {businessData && (
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {businessData.businessName}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {businessData.location}
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {businessData.description || 'No description provided'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Contact Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {businessData.contactPhone || 'Not provided'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* My Items Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">My Items</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Manage the items you have listed for sharing or rental.</p>
            </div>
            <div className="mt-5 flex space-x-3">
              <Link
                href="/dashboard/business/items"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Items
              </Link>
              <Link
                href="/dashboard/business/items/new"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add New Item
              </Link>
            </div>
          </div>
        </div>

        {/* Incoming Requests Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Requests</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>View and manage requests for your listed items.</p>
            </div>
            <div className="mt-5">
              <Link
                href="/dashboard/business/requests"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Requests
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
