'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Bell, Shield, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg">
            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.emailAddresses?.[0]?.emailAddress || ''}</p>
          </div>
          <Link href="/auth/profile-setup" className="text-sm font-medium text-orange-600 hover:text-orange-700">
            Edit
          </Link>
        </div>
      </div>

      {/* Settings List */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        <Link href="/auth/profile-setup" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-700">Profile Information</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </Link>

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-700">Push Notifications</span>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              notifications ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              notifications ? 'translate-x-[18px]' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        <Link href="/privacy" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-700">Privacy & Security</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </Link>
      </div>
    </div>
  );
}
