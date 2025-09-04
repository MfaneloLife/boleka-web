'use client';

import React, { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const [profileType, setProfileType] = useState<'client' | 'business'>('client');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleProfileType = () => {
    setProfileType(profileType === 'client' ? 'business' : 'client');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-white text-xl font-bold">
                  Boleka
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className="border-transparent text-white hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                {profileType === 'business' ? (
                  <>
                    <Link
                      href="/dashboard/business/items"
                      className="border-transparent text-white hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      My Items
                    </Link>
                    <Link
                      href="/dashboard/business/requests"
                      className="border-transparent text-white hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Requests
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard/client/search"
                      className="border-transparent text-white hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Search Items
                    </Link>
                    <Link
                      href="/dashboard/client/requests"
                      className="border-transparent text-white hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      My Requests
                    </Link>
                  </>
                )}
                <Link
                  href="/messages"
                  className="border-transparent text-white hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Messages
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <NotificationDropdown />
                  
                  <button
                    onClick={toggleProfileType}
                    className="bg-orange-700 p-1 rounded-full text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-orange-600 focus:ring-white"
                  >
                    <span className="sr-only">Switch profile</span>
                    <span className="px-2 py-1 text-sm">
                      {profileType === 'client' ? 'Switch to Business' : 'Switch to Client'}
                    </span>
                  </button>
                  
                  <div className="flex items-center">
                    <span className="text-white text-sm font-medium mr-2">
                      {session?.user?.name || 'User'}
                    </span>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="text-white hover:text-gray-200 text-sm font-medium"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-gray-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                href="/dashboard"
                className="bg-indigo-700 text-white block pl-3 pr-4 py-2 text-base font-medium"
              >
                Dashboard
              </Link>
              {profileType === 'business' ? (
                <>
                  <Link
                    href="/dashboard/business/items"
                    className="text-white hover:bg-indigo-700 block pl-3 pr-4 py-2 text-base font-medium"
                  >
                    My Items
                  </Link>
                  <Link
                    href="/dashboard/business/requests"
                    className="text-white hover:bg-indigo-700 block pl-3 pr-4 py-2 text-base font-medium"
                  >
                    Requests
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard/client/search"
                    className="text-white hover:bg-indigo-700 block pl-3 pr-4 py-2 text-base font-medium"
                  >
                    Search Items
                  </Link>
                  <Link
                    href="/dashboard/client/requests"
                    className="text-white hover:bg-indigo-700 block pl-3 pr-4 py-2 text-base font-medium"
                  >
                    My Requests
                  </Link>
                </>
              )}
              <Link
                href="/messages"
                className="text-white hover:bg-indigo-700 block pl-3 pr-4 py-2 text-base font-medium"
              >
                Messages
              </Link>
              <button
                onClick={toggleProfileType}
                className="w-full text-left text-white hover:bg-indigo-700 block pl-3 pr-4 py-2 text-base font-medium"
              >
                {profileType === 'client' ? 'Switch to Business' : 'Switch to Client'}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full text-left text-white hover:bg-indigo-700 block pl-3 pr-4 py-2 text-base font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
