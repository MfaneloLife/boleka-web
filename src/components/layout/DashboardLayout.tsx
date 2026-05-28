'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import {
  Home,
  Store,
  Wallet,
  MessageSquare,
  Settings,
  Package,
  LogIn,
  UserPlus,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'My Shop', href: '/dashboard/items', icon: Store },
  { name: 'My Wallet', href: '/dashboard/wallet', icon: Wallet },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'My Rentals', href: '/dashboard/orders', icon: Package },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/dashboard/items') return pathname?.startsWith('/dashboard/items');
    return pathname?.startsWith(href);
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">BOLEKA</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User greeting - only when signed in */}
        {isLoaded && user && (
          <div className="px-5 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.fullName || user.emailAddresses?.[0]?.emailAddress || 'User'}
                </p>
                <p className="text-xs text-gray-500">Welcome back! 👋</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1 truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom - Sign up / Log in OR Sign out */}
        <div className="border-t border-gray-100 p-4 space-y-2">
          {isLoaded && !user ? (
            <>
              <Link
                href="/auth/login"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-orange-600 hover:bg-orange-50 transition-all"
              >
                <LogIn className="w-5 h-5" />
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm"
              >
                <UserPlus className="w-5 h-5" />
                Sign up
              </Link>
            </>
          ) : isLoaded && user ? (
            <button
              onClick={() => signOut(() => router.push('/'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          ) : null}
          <p className="text-[10px] text-gray-400 text-center">Boleka v1.0 • Rent & Share items</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">B</span>
              </div>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">BOLEKA</span>
            </Link>
            <div className="w-9 h-9" /> {/* Spacer */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="px-4 py-5 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
