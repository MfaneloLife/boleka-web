'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

interface BankingDetails {
  bankName: string;
  accountNumber: string;
  accountType: string;
  branchCode: string;
  accountHolderName: string;
}

interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  bankName?: string;
  accountNumber?: string;
  accountType?: string;
  branchCode?: string;
  accountHolderName?: string;
}

export default function BankingDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BankingDetails>({
    bankName: '',
    accountNumber: '',
    accountType: '',
    branchCode: '',
    accountHolderName: ''
  });

  const accountTypes = [
    'Current Account',
    'Savings Account',
    'Cheque Account'
  ];

  const southAfricanBanks = [
    'ABSA Bank',
    'Standard Bank',
    'FirstNational Bank (FNB)',
    'Nedbank',
    'Capitec Bank',
    'African Bank',
    'Investec',
    'Discovery Bank',
    'TymeBank',
    'Bank Zero',
    'Bidvest Bank',
    'Sasfin Bank',
    'Other'
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    const fetchBusinessProfile = async () => {
      try {
        const response = await fetch('/api/business/profile');
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/dashboard/business/create-profile');
            return;
          }
          throw new Error('Failed to fetch business profile');
        }
        
        const data = await response.json();
        setBusinessProfile(data);
        
        // Pre-fill form with existing banking details
        if (data) {
          setFormData({
            bankName: data.bankName || '',
            accountNumber: data.accountNumber || '',
            accountType: data.accountType || '',
            branchCode: data.branchCode || '',
            accountHolderName: data.accountHolderName || ''
          });
        }
      } catch (error) {
        console.error('Error fetching business profile:', error);
        setError('Failed to load business profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchBusinessProfile();
    }
  }, [status, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any previous success/error messages
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/business/banking-details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update banking details');
      }

      setSuccess('Banking details updated successfully!');
      
      // Redirect to earnings page after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/business/earnings');
      }, 2000);
      
    } catch (error) {
      console.error('Error updating banking details:', error);
      setError('Failed to update banking details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return <Loading />;
  }

  if (error && !businessProfile) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Banking Details</h1>
          <p className="text-blue-100 mt-1">
            Required to receive payments from Boleka rentals
          </p>
        </div>

        {/* Important Information */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> Your banking details are securely stored and used only for transferring your earnings. 
                Boleka charges a 8% platform fee on all transactions, and the remaining 92% is transferred to your account.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Bank Name */}
          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name *
            </label>
            <select
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select your bank</option>
              {southAfricanBanks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          {/* Account Holder Name */}
          <div>
            <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name *
            </label>
            <input
              type="text"
              id="accountHolderName"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleInputChange}
              required
              placeholder="Full name as it appears on your bank account"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Account Number */}
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Account Number *
            </label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              required
              placeholder="Your bank account number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Account Type */}
          <div>
            <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-1">
              Account Type *
            </label>
            <select
              id="accountType"
              name="accountType"
              value={formData.accountType}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select account type</option>
              {accountTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Branch Code */}
          <div>
            <label htmlFor="branchCode" className="block text-sm font-medium text-gray-700 mb-1">
              Branch Code *
            </label>
            <input
              type="text"
              id="branchCode"
              name="branchCode"
              value={formData.branchCode}
              onChange={handleInputChange}
              required
              placeholder="6-digit branch code"
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can find your branch code on your bank card or statements
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Banking Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
