'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

type ProfileType = 'client' | 'business';

interface ProfileSetupFormData {
  // Business profile fields
  businessName?: string;
  businessDescription?: string;
  businessLocation?: string;
  businessPhone?: string;
  
  // Client profile fields
  address?: string;
  contactPhone?: string;
  preferences?: string;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [profileType, setProfileType] = useState<ProfileType>('client');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSetupFormData>();

  const onSubmit = async (data: ProfileSetupFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const endpoint = profileType === 'business' 
        ? '/api/profile/business' 
        : '/api/profile/client';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update profile');
      }

      // Redirect to dashboard based on profile type
      router.push(profileType === 'business' ? '/dashboard/business' : '/dashboard/client');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set Up Your Profile</h1>
          <p className="mt-2 text-gray-600">
            Choose the type of profile you want to start with. You can always add another type later.
          </p>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => setProfileType('client')}
            className={`flex-1 p-4 border rounded-lg ${
              profileType === 'client'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300'
            }`}
          >
            <h3 className="text-lg font-medium">Client Profile</h3>
            <p className="mt-1 text-sm text-gray-500">
              Search for items, send requests, and make payments
            </p>
          </button>
          
          <button
            type="button"
            onClick={() => setProfileType('business')}
            className={`flex-1 p-4 border rounded-lg ${
              profileType === 'business'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300'
            }`}
          >
            <h3 className="text-lg font-medium">Business Profile</h3>
            <p className="mt-1 text-sm text-gray-500">
              List items, accept requests, and receive payments
            </p>
          </button>
        </div>

        {error && (
          <div className="p-3 text-sm text-white bg-red-500 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {profileType === 'business' ? (
            <>
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  Business Name *
                </label>
                <input
                  id="businessName"
                  type="text"
                  {...register('businessName', {
                    required: 'Business name is required',
                  })}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700">
                  Business Description
                </label>
                <textarea
                  id="businessDescription"
                  rows={3}
                  {...register('businessDescription')}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="businessLocation" className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <input
                  id="businessLocation"
                  type="text"
                  {...register('businessLocation', {
                    required: 'Location is required',
                  })}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.businessLocation && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessLocation.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  id="businessPhone"
                  type="tel"
                  {...register('businessPhone')}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  id="address"
                  type="text"
                  {...register('address')}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  id="contactPhone"
                  type="tel"
                  {...register('contactPhone')}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="preferences" className="block text-sm font-medium text-gray-700">
                  Preferences (What are you looking for?)
                </label>
                <textarea
                  id="preferences"
                  rows={3}
                  {...register('preferences')}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </>
          )}

          <div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSubmitting ? 'Setting up profile...' : 'Continue'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            You can always add {profileType === 'client' ? 'a business' : 'a client'} profile later from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
