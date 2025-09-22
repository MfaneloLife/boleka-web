"use client";

import { useState, Fragment, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { 
  UserCircleIcon, 
  ChevronDownIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/src/lib/firebase';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function AuthButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<{ name?: string | null; email?: string | null; image?: string | null } | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser({ name: u.displayName, email: u.email, image: u.photoURL });
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  // Prevent hydration mismatch by not rendering during SSR
  if (!isClient) {
    return null;
  }

  if (!isClient) {
    return null;
  }

  if (user === undefined) {
    return (
      <div className="flex items-center space-x-4">
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          href="/auth/login"
          className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Sign In
        </Link>
        <Link
          href="/auth/login"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* User menu dropdown */}
      <Menu as="div" className="relative">
        <div>
          <Menu.Button className="flex items-center space-x-2 text-sm rounded-full bg-gray-100 p-1 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <span className="sr-only">Open user menu</span>
            {user.image ? (
              <img
                className="h-8 w-8 rounded-full"
                src={String(user.image)}
                alt={String(user.name || 'User avatar')}
              />
            ) : (
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
            )}
            <span className="hidden md:block text-sm font-medium text-gray-700">
              {String(user?.name || (user?.email ? user.email.split('@')[0] : 'User'))}
            </span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm text-gray-700 font-medium">
                {String(user?.name || 'User')}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {String(user?.email || '')}
              </p>
            </div>

            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/dashboard/client"
                  className={classNames(
                    active ? 'bg-gray-100' : '',
                    'flex items-center px-4 py-2 text-sm text-gray-700'
                  )}
                >
                  <UserIcon className="mr-3 h-4 w-4" />
                  Dashboard
                </Link>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/profile"
                  className={classNames(
                    active ? 'bg-gray-100' : '',
                    'flex items-center px-4 py-2 text-sm text-gray-700'
                  )}
                >
                  <CogIcon className="mr-3 h-4 w-4" />
                  Profile Settings
                </Link>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className={classNames(
                    active ? 'bg-gray-100' : '',
                    'flex items-center w-full px-4 py-2 text-sm text-gray-700 disabled:opacity-50'
                  )}
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}