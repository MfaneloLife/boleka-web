'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';

interface ProfileSetupFormData {
  businessName: string;
  province: string;
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

  const provinces = [
    'Mpumalanga',
    'Gauteng',
    'KwaZulu-Natal',
    'Free State',
    'Eastern Cape',
    'North West',
    'Western Cape',
    'Limpopo',
    'Northern Cape'
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSetupFormData>({
    defaultValues: {
      returnWindow: '48',
      lateFeePerDay: '50'
    }
  });

  async function onSubmit(data: ProfileSetupFormData) {
    setIsSubmitting(true);
    setError(null);

    if (!currentUser) {
      setError('Please sign in before setting up your profile.');
      setIsSubmitting(false);
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/profile/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessName: data.businessName,
          province: data.province,
          city: data.city,
          suburb: data.suburb,
          contactNumber: data.contactNumber,
          access: 'Both',
          returnWindowHours: Number(data.returnWindow),
          lateFeePerDay: Number(data.lateFeePerDay),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to save profile');
      }

      router.push('/dashboard/business');
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
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">One account. Full access.</h1>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Complete your vendor profile once and start listing items, accepting requests, and managing return terms.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Business Name</span>
                <input
                  type="text"
                  {...register('businessName', { required: 'Business name is required' })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                {errors.businessName && <p className="mt-2 text-sm text-red-600">{errors.businessName.message}</p>}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Contact Number</span>
                <input
                  type="tel"
                  {...register('contactNumber', { required: 'Contact number is required' })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                {errors.contactNumber && <p className="mt-2 text-sm text-red-600">{errors.contactNumber.message}</p>}
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Province</span>
                <select
                  {...register('province', { required: 'Province is required' })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                >
                  <option value="">Select Province</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                {errors.province && <p className="mt-2 text-sm text-red-600">{errors.province.message}</p>}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">City</span>
                <input
                  type="text"
                  {...register('city', { required: 'City is required' })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                {errors.city && <p className="mt-2 text-sm text-red-600">{errors.city.message}</p>}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Suburb</span>
                <input
                  type="text"
                  {...register('suburb', { required: 'Suburb is required' })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                {errors.suburb && <p className="mt-2 text-sm text-red-600">{errors.suburb.message}</p>}
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Return window (hours)</span>
                <input
                  type="number"
                  min="1"
                  {...register('returnWindow', { required: 'Return window is required' })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                {errors.returnWindow && <p className="mt-2 text-sm text-red-600">{errors.returnWindow.message}</p>}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Late fee per day (R)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  {...register('lateFeePerDay', { required: 'Late return fee is required' })}
                  className="mt-2 block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
                {errors.lateFeePerDay && <p className="mt-2 text-sm text-red-600">{errors.lateFeePerDay.message}</p>}
              </label>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Saving profile…' : 'Save business settings'}
              </Button>
            </div>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
            <p className="font-medium text-slate-900">What this does</p>
            <p className="mt-2">
              These details let your account offer both listing and request capabilities, and set the vendor return window plus late return fee for your items.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
