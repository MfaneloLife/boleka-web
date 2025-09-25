'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/src/lib/firebase';

type FormState = {
  businessName: string;
  province: string;
  city: string;
  suburb: string;
  contactNumber: string;
  access: string;
};

export default function BusinessProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    businessName: '',
    province: '',
    city: '',
    suburb: '',
    contactNumber: '',
    access: '',
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      try {
        setLoading(true);
        const idToken = await user.getIdToken();
        const res = await fetch('/api/business/profile', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) {
          throw new Error('Failed to load business profile');
        }
        const data = await res.json();
        setForm({
          businessName: data.businessName || '',
          province: data.province || '',
          city: data.city || '',
          suburb: data.suburb || '',
          contactNumber: data.phone || '',
          access: data.access || '',
        });
      } catch (e) {
        console.error(e);
        setError('Unable to load business profile');
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const idToken = await user.getIdToken();
      const res = await fetch('/api/profile/business', {
        method: 'POST', // endpoint supports create-or-update
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          businessName: form.businessName,
          province: form.province,
          city: form.city,
          suburb: form.suburb,
          contactNumber: form.contactNumber,
          access: form.access,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to save business profile');
      }
      setSuccess('Business profile updated');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Business Profile</h1>
      <p className="text-gray-600 mb-6">Edit your business details.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5 bg-white p-6 rounded-lg shadow">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">{success}</div>
          )}

          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              id="businessName"
              name="businessName"
              value={form.businessName}
              onChange={onChange}
              placeholder="e.g., ToolShare SA"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <input
                id="province"
                name="province"
                value={form.province}
                onChange={onChange}
                placeholder="Province"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                id="city"
                name="city"
                value={form.city}
                onChange={onChange}
                placeholder="City"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="suburb" className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
              <input
                id="suburb"
                name="suburb"
                value={form.suburb}
                onChange={onChange}
                placeholder="Suburb"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                id="contactNumber"
                name="contactNumber"
                value={form.contactNumber}
                onChange={onChange}
                placeholder="e.g., 071 234 5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="access" className="block text-sm font-medium text-gray-700 mb-1">Access</label>
              <select
                id="access"
                name="access"
                value={form.access}
                onChange={onChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select</option>
                <option value="Delivery">Delivery</option>
                <option value="Collection only">Collection only</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/business')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
