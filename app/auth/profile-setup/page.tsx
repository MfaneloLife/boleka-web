'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';

interface ProfileSetupFormData {
  businessName?: string;
  province?: string;
  city?: string;
  suburb?: string;
  contactNumber?: string;
  access?: string;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const searchParams = useSearchParams(); // kept in case of future use
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // South African provinces
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

  // Access options for business
  const accessOptions = [
    'Delivery',
    'Collection only',
    'Both'
  ];
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSetupFormData>();

  const onSubmit = async (data: ProfileSetupFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!currentUser) {
        throw new Error('You must be logged in to create a profile');
      }

      // Get the Firebase ID token
      const idToken = await currentUser.getIdToken();

      const response = await fetch('/api/profile/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update profile');
      }

      // Redirect to business dashboard after setup
      router.push('/dashboard/business');
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
          <h1 className="text-2xl font-bold">Set up your Business Profile</h1>
          <p className="mt-2 text-gray-600">Create your business profile to list items, accept requests, and get paid.</p>
        </div>


        {error && (
          <div className="p-3 text-sm text-white bg-red-500 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
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
                <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                  Province *
                </label>
                <select
                  id="province"
                  {...register('province', {
                    required: 'Province is required',
                  })}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Choose your Province</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  {...register('city', {
                    required: 'City is required',
                  })}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="suburb" className="block text-sm font-medium text-gray-700">
                  Suburb *
                </label>
                <input
                  id="suburb"
                  type="text"
                  {...register('suburb', {
                    required: 'Suburb is required',
                  })}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.suburb && (
                  <p className="mt-1 text-sm text-red-600">{errors.suburb.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">
                  Contact Number *
                </label>
                <input
                  id="contactNumber"
                  type="tel"
                  {...register('contactNumber', {
                    required: 'Contact number is required',
                  })}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.contactNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactNumber.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="access" className="block text-sm font-medium text-gray-700">
                  Access *
                </label>
                <select
                  id="access"
                  {...register('access', {
                    required: 'Access option is required',
                  })}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Choose access option</option>
                  {accessOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.access && (
                  <p className="mt-1 text-sm text-red-600">{errors.access.message}</p>
                )}
              </div>
            </>

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isSubmitting ? 'Setting up profile...' : 'Save Profile'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            You can always edit your business profile later from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
