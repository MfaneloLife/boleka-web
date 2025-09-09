'use client';

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

type ProfileType = 'client' | 'business';

interface ProfileSetupFormData {
  // Business profile fields
  businessName?: string;
  province?: string;
  city?: string;
  suburb?: string;
  contactNumber?: string;
  access?: string;
  
  // Client profile fields
  clientProvince?: string;
  clientCity?: string;
  clientSuburb?: string;
  cellPhone?: string;
  preferences?: string;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [profileType, setProfileType] = useState<ProfileType>('client');
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

  // Preference options for client
  const preferenceOptions = [
    'Everything',
    'Tools',
    'Equipment'
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
          ) : (
            <>
              <div>
                <label htmlFor="clientProvince" className="block text-sm font-medium text-gray-700">
                  Province *
                </label>
                <select
                  id="clientProvince"
                  {...register('clientProvince', {
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
                {errors.clientProvince && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientProvince.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="clientCity" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  id="clientCity"
                  type="text"
                  {...register('clientCity', {
                    required: 'City is required',
                  })}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.clientCity && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientCity.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="clientSuburb" className="block text-sm font-medium text-gray-700">
                  Suburb (optional)
                </label>
                <input
                  id="clientSuburb"
                  type="text"
                  {...register('clientSuburb')}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="cellPhone" className="block text-sm font-medium text-gray-700">
                  Cell Phone (optional)
                </label>
                <input
                  id="cellPhone"
                  type="tel"
                  {...register('cellPhone')}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="preferences" className="block text-sm font-medium text-gray-700">
                  Preferences *
                </label>
                <select
                  id="preferences"
                  {...register('preferences', {
                    required: 'Preference is required',
                  })}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Choose your preference</option>
                  {preferenceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.preferences && (
                  <p className="mt-1 text-sm text-red-600">{errors.preferences.message}</p>
                )}
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
