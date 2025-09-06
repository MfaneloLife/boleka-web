'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tab } from '@headlessui/react';
import ReviewList from '@/components/reviews/ReviewList';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ReviewsPage() {
  const { status } = useSession();
  const [selectedTab, setSelectedTab] = useState(0);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            You need to be logged in to view this page
          </h1>
          <p className="text-gray-600 mb-8">
            Please sign in to access your reviews.
          </p>
          <a
            href="/auth/login"
            className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const categories = [
    { name: 'Reviews I\'ve Received', type: 'received' },
    { name: 'Reviews I\'ve Given', type: 'given' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Reviews</h1>

      <div className="w-full">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-orange-50 p-1 mb-6">
            {categories.map((category) => (
              <Tab
                key={category.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-orange-700',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-orange-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-white shadow'
                      : 'text-orange-600 hover:bg-white/[0.12] hover:text-orange-700'
                  )
                }
              >
                {category.name}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel>
              <ReviewList type="received" />
            </Tab.Panel>
            <Tab.Panel>
              <ReviewList type="given" />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
}
