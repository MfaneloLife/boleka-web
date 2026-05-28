'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Bell, Shield, User, ChevronRight, Loader2, Save, Globe } from 'lucide-react';
import Link from 'next/link';

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  phone: string | null;
  country: string;
  region: string;
  city: string;
  address: string;
  profileCompleted: boolean;
  hasBusinessProfile: boolean;
}

export default function SettingsPage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', country: 'ZA', region: '', city: '', address: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm({
          name: data.name || '',
          phone: data.phone || '',
          country: data.country || 'ZA',
          region: data.region || '',
          city: data.city || '',
          address: data.address || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setEditMode(false);
        fetchProfile();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
        </div>
      ) : (
        <>
          {/* Profile Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {profile?.image ? (
                  <img src={profile.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  form.name?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile?.name || user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{profile?.email || user?.emailAddresses?.[0]?.emailAddress || ''}</p>
                {profile?.phone && <p className="text-xs text-gray-400">{profile.phone}</p>}
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-sm font-medium text-orange-600 hover:text-orange-700 shrink-0"
              >
                {editMode ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {/* Edit Form */}
            {editMode && (
              <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <label className="text-xs font-medium text-gray-600">Full Name</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Phone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                    placeholder="+27 XX XXX XXXX"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Country</label>
                    <input
                      value={form.country}
                      onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                      placeholder="ZA"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Region/Province</label>
                    <input
                      value={form.region}
                      onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                      placeholder="e.g. Gauteng"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600">City</label>
                    <input
                      value={form.city}
                      onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                      placeholder="e.g. Johannesburg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Address</label>
                    <input
                      value={form.address}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                      placeholder="Street address"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2 rounded-xl text-sm hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {saved && <p className="text-xs text-green-600 text-center">Profile updated successfully!</p>}
              </div>
            )}
          </div>

          {/* Settings List */}
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            <Link href="/auth/profile-setup" className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-700">Profile Information</span>
                  <p className="text-xs text-gray-400 mt-0.5">Manage your personal details</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>

            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-700">Push Notifications</span>
                  <p className="text-xs text-gray-400 mt-0.5">Get notified about requests and updates</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
                  notifications ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <Link href="/privacy" className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-700">Privacy & Security</span>
                  <p className="text-xs text-gray-400 mt-0.5">Manage your data and security settings</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          </div>

          {/* Location Info */}
          {profile && (profile.city || profile.region) && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Location: {[profile.city, profile.region, profile.country].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
