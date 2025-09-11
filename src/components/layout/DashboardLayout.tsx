'use client';

import React, { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';
import { 
  HomeIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  CubeIcon,
  BanknotesIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [profileType, setProfileType] = useState<'client' | 'business'>('client');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Determine profile type based on current path
  useEffect(() => {
    if (pathname?.includes('/business/')) {
      setProfileType('business');
    } else {
      setProfileType('client');
    }
  }, [pathname]);

  const toggleProfileType = () => {
    const newType = profileType === 'client' ? 'business' : 'client';
    setProfileType(newType);
    
    // Redirect to appropriate dashboard
    if (newType === 'business') {
      router.push('/dashboard/business/items');
    } else {
      router.push('/dashboard/client/search');
    }
  };

  const clientNavItems = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'Search Items', href: '/dashboard/client/search', icon: MagnifyingGlassIcon },
    { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'My Requests', href: '/dashboard/client/requests', icon: ClipboardDocumentListIcon },
  ];

  const businessNavItems = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'My Items', href: '/dashboard/business/items', icon: CubeIcon },
    { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Requests', href: '/dashboard/business/requests', icon: ClipboardDocumentListIcon },
    { name: 'Notifications', href: '/dashboard/business/notifications', icon: BellIcon },
    { name: 'Earnings', href: '/dashboard/business/earnings', icon: BanknotesIcon },
  ];

  const navItems = profileType === 'client' ? clientNavItems : businessNavItems;

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-orange-600">Boleka</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 py-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-200 p-6">
          {/* Profile switcher */}
          <button
            onClick={toggleProfileType}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors mb-4"
          >
            <UserCircleIcon className="h-5 w-5 mr-3" />
            Switch to {profileType === 'client' ? 'Business' : 'Client'}
          </button>

          {/* User info */}
          <div className="flex items-center px-4 py-2 mb-2">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <UserCircleIcon className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {profileType} Profile
              </p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <span className="text-xl font-bold text-orange-600">Boleka</span>
            <div className="flex items-center space-x-2">
              <NotificationDropdown />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
