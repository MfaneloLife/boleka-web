'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { COUNTRIES, COUNTRY_LIST, type Country } from '@/src/lib/countries';

interface ProfileSetupFormData {
  businessName: string;
  country: string;
  region: string;
  city: string;
  suburb: string;
  contactNumber: string;
  returnWindow: string;
  lateFeePerDay: string;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('ZA');
  const [availableRegions, setAvailableRegions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const country = COUNTRIES[selectedCountry];
    if (country) {
      setAvailableRegions(country.regions);
    } else {
      setAvailableRegions([]);
    }
  }, [selectedCountry]);

  const [formData, setFormData] = useState<ProfileSetupFormData>({
    businessName: '',
    country: 'ZA',
    region: '',
    city: '',
    suburb: '',
    contactNumber: '',
    returnWindow: '48',
    lateFeePerDay: '50',
  });

  const handleChange = (field: keyof ProfileSetupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'country') {
      setSelectedCountry(value);
      setFormData((prev) => ({ ...prev, region: '' }));
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!currentUser) {
      setError('Please sign in before setting up your profile.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/profile/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          country: formData.country,
          region: formData.region,
          city: formData.city,
          suburb: formData.suburb,
          contactNumber: formData.contactNumber,
          returnWindowHours: Number(formData.returnWindow),
          lateFeePerDay: Number(formData.lateFeePerDay),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to save profile');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-10">
          <div className="mb-8 space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">Account setup</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Set up your vendor profile</h1>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Complete your profile to start listing items and accepting rental requests.
              Choose your country and region so customers can find you.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Business Name</span>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Contact Number</span>
                <input
                  type="tel"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                  placeholder="+27 12 345 6789"
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Country</span>
                <select
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">Select Country</option>
                  {COUNTRY_LIST.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {selectedCountry === 'US' ? 'State' : selectedCountry === 'CN' ? 'Province' : 'Province / Region'}
                </span>
                <select
                  value={formData.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  required
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">
                    {selectedCountry === 'US' ? 'Select State' : 'Select Region'}
                  </option>
                  {availableRegions.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">City</span>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Suburb / District</span>
                <input
                  type="text"
                  value={formData.suburb}
                  onChange={(e) => handleChange('suburb', e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Return window (hours)</span>
                <input
                  type="number"
                  min="1"
                  value={formData.returnWindow}
                  onChange={(e) => handleChange('returnWindow', e.target.value)}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </label>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving profile…' : 'Save vendor settings'}
              </button>
            </div>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-900">What this does</p>
            <p className="mt-2">
              Set your location so customers can find items near them. Your country and region
              will be shown on your listings. You can update these settings anytime from your dashboard.
              Currently supported regions include South Africa, United States, China, UK, EU countries,
              and more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
