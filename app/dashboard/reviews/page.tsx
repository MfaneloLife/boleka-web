'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Tab } from '@headlessui/react';
import ReviewList from '@/components/reviews/ReviewList';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ReviewsPage() {
  const { isLoaded } = useUser();
  const [selectedTab, setSelectedTab] = useState(0);

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Reviews</h1>

      <div className="w-full">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-orange-50 p-1 mb-6">
            {[{ name: "Reviews I've Received", type: 'received' }, { name: "Reviews I've Given", type: 'given' }].map((category) => (
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
