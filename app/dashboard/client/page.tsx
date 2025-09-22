'use client';

import Link from 'next/link';

export default function ClientDashboardPage() {

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
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Suggested Items</h3>
          </div>
          <div className="p-4 sm:p-6">
            <p className="text-gray-500">No items to display yet. Start searching to see relevant items here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
