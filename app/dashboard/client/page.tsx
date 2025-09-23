'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type PublicItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  images?: string[];
  imageUrl?: string;
  category?: string;
  location?: string;
};

export default function ClientDashboardPage() {
  const [suggested, setSuggested] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Public endpoint: fetch available items (recent first)
        const res = await fetch('/api/items');
        if (!res.ok) throw new Error('Failed to fetch items');
        const data = await res.json();
        const items: PublicItem[] = (data.items || []).slice(0, 12);
        setSuggested(items);
      } catch (e) {
        setError('Failed to load items');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Find what you need and manage your requests
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Search Items Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Find Items</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Search for items available for sharing or rental in your area.</p>
            </div>
            <div className="mt-5">
              <Link
                href="/dashboard/client/search"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Search Items
              </Link>
            </div>
          </div>
        </div>

        {/* My Requests Card */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">My Requests</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>View and manage your active requests and their status.</p>
            </div>
            <div className="mt-5">
              <Link
                href="/dashboard/client/requests"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View My Requests
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Items Section */}
      <div className="mt-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Available Items</h3>
            <Link href="/dashboard/client/search" className="text-sm text-indigo-600 hover:text-indigo-700">See all</Link>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-gray-500">Loading items…</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : suggested.length === 0 ? (
              <p className="text-gray-500">No items available yet. Check back soon.</p>
            ) : (
              <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {suggested.map((item) => (
                  <li key={item.id} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
                    <div className="w-full h-40 bg-gray-100 relative">
                      {((item.images && item.images[0]) || item.imageUrl) ? (
                        <Image
                          src={(item.images && item.images[0]) || (item.imageUrl as string)}
                          alt={item.title}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <h4 className="text-base font-semibold text-gray-900 line-clamp-1">{item.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                      <div className="text-sm text-gray-700">R{item.price}/day</div>
                      {item.location && (
                        <div className="text-xs text-gray-500">{item.location}</div>
                      )}
                    </div>
                    <div className="px-4 py-3 bg-gray-50">
                      <Link href={`/dashboard/items/${item.id}`} className="text-sm text-indigo-600 hover:text-indigo-700">View details</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
