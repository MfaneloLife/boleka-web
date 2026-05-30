'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  Store,
  Package,
  ClipboardList,
  Wallet,
  Star,
  Award,
  ShoppingBag,
  Bell,
  Settings,
  User,
  TrendingUp,
  Clock,
  BarChart3,
} from 'lucide-react';

const quickActions = [
  { name: 'My Shop', href: '/dashboard/items', icon: Store, color: 'bg-orange-500', count: 'Manage' },
  { name: 'Items', href: '/dashboard/items', icon: Package, color: 'bg-blue-500', count: 'View' },
  { name: 'Requests', href: '/dashboard/requests', icon: ClipboardList, color: 'bg-purple-500', count: 'View' },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingBag, color: 'bg-green-500', count: 'View' },
  { name: 'Wallet', href: '/dashboard/wallet', icon: Wallet, color: 'bg-amber-500', count: 'View' },
  { name: 'Reviews', href: '/dashboard/reviews', icon: Star, color: 'bg-pink-500', count: 'View' },
  { name: 'Messages', href: '/messages', icon: User, color: 'bg-indigo-500', count: 'View' },
  { name: 'Rewards', href: '/dashboard/rewards', icon: Award, color: 'bg-emerald-500', count: 'View' },
];

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState({
    totalItems: 0,
    activeRentals: 0,
    requests: 0,
    earnings: 0,
  });

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(prev => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hey{isLoaded && user?.firstName ? `, ${user.firstName}` : ''} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here's your dashboard overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Items', value: stats.totalItems, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Rentals', value: stats.activeRentals, icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Requests', value: stats.requests, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Earnings', value: `R${stats.earnings}`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 hover:shadow-sm transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} bg-opacity-10 flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors">{action.name}</p>
                  <p className="text-xs text-gray-400">{action.count}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <div className="flex items-center justify-center py-8 text-gray-400">
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Your activity will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
