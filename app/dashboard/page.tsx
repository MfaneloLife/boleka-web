'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      // Fetch user profile data to see if they have a business profile
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          setHasBusinessProfile(data.hasBusinessProfile || false);
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

  return (
    <div>
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {session?.user?.name || 'User'}</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Choose a profile to continue with or manage your items and requests
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Client Profile Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Client Profile</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Search for items, send requests, and make payments as a client.</p>
            </div>
            <div className="mt-5">
              <Link
                href="/dashboard/client"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Go to Client Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Business Profile Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Business Profile</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>List items, accept requests, and receive payments as a business.</p>
            </div>
            <div className="mt-5">
              {hasBusinessProfile ? (
                <Link
                  href="/dashboard/business"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Business Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/profile-setup?type=business"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Set up Business Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
          </div>
          <ul role="list" className="divide-y divide-gray-200">
            <li className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-600 truncate">
                  No recent activity found
                </p>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500">
                    Start using the platform to see your activity here
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
