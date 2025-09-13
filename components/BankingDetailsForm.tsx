'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/Button';

interface BankingDetailsFormProps {
  businessId: string;
  existingDetails?: {
    bankName?: string;
    accountNumber?: string;
    accountType?: string;
    branchCode?: string;
    accountHolderName?: string;
  };
  onSuccess?: () => void;
}

export default function BankingDetailsForm({ 
  businessId, 
  existingDetails,
  onSuccess
}: BankingDetailsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bankName: existingDetails?.bankName || '',
      accountNumber: existingDetails?.accountNumber || '',
      accountType: existingDetails?.accountType || 'Savings',
      branchCode: existingDetails?.branchCode || '',
      accountHolderName: existingDetails?.accountHolderName || '',
    }
  });

  interface BankingDetailsData {
    bankName: string;
    accountNumber: string;
    accountType: string;
    branchCode: string;
    accountHolderName: string;
  }

  const onSubmit = async (data: BankingDetailsData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/business/banking-details/${businessId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update banking details');
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error updating banking details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Banking Details</h2>
      <p className="text-sm text-gray-500 mb-6">
        Your banking details are required to receive payments from rentals. Boleka will deposit rental payments minus 8% commission directly to this account.
      </p>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 rounded-md">
          Banking details updated successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
            Bank Name
          </label>
          <input
            id="bankName"
            type="text"
            {...register('bankName', { required: 'Bank name is required' })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
          {errors.bankName && (
            <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
            Account Number
          </label>
          <input
            id="accountNumber"
            type="text"
            {...register('accountNumber', { 
              required: 'Account number is required',
              pattern: {
                value: /^[0-9]{5,16}$/,
                message: 'Enter a valid account number (5-16 digits)',
              },
            })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
          {errors.accountNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
            Account Type
          </label>
          <select
            id="accountType"
            {...register('accountType', { required: 'Account type is required' })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="Savings">Savings</option>
            <option value="Cheque">Cheque</option>
            <option value="Current">Current</option>
            <option value="Transmission">Transmission</option>
          </select>
          {errors.accountType && (
            <p className="mt-1 text-sm text-red-600">{errors.accountType.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="branchCode" className="block text-sm font-medium text-gray-700">
            Branch Code
          </label>
          <input
            id="branchCode"
            type="text"
            {...register('branchCode', { 
              required: 'Branch code is required',
              pattern: {
                value: /^[0-9]{4,8}$/,
                message: 'Enter a valid branch code (4-8 digits)',
              },
            })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
          {errors.branchCode && (
            <p className="mt-1 text-sm text-red-600">{errors.branchCode.message}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700">
            Account Holder Name
          </label>
          <input
            id="accountHolderName"
            type="text"
            {...register('accountHolderName', { required: 'Account holder name is required' })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
          />
          {errors.accountHolderName && (
            <p className="mt-1 text-sm text-red-600">{errors.accountHolderName.message}</p>
          )}
        </div>
        
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            {existingDetails?.bankName ? 'Update Banking Details' : 'Save Banking Details'}
          </Button>
        </div>
      </form>
    </div>
  );
}
