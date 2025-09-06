"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

type Payment = {
  id: string;
  amount: number;
  commissionAmount: number;
  merchantAmount: number;
  status: string;
  merchantPaid: boolean;
  merchantPayoutDate: string | null;
  createdAt: string;
  updatedAt: string;
  request: {
    id: string;
    item: {
      id: string;
      title: string;
    };
  };
  payer: {
    id: string;
    name: string;
    email: string;
  };
};

type BankingDetails = {
  bankName: string | null;
  accountNumber: string | null;
  accountType: string | null;
  branchCode: string | null;
  accountHolderName: string | null;
};

type PayoutsResponse = {
  pendingPayouts: Payment[];
  summary: {
    count: number;
    totalAmount: number;
    totalCommission: number;
    totalMerchantAmount: number;
  };
  bankingDetails: BankingDetails;
};

export default function EarningsPage() {
  const [data, setData] = useState<PayoutsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if banking details are complete
  const isBankingComplete = (details: BankingDetails | null) => {
    if (!details) return false;
    return !!(
      details.bankName &&
      details.accountNumber &&
      details.accountType &&
      details.branchCode &&
      details.accountHolderName
    );
  };

  // Fetch payouts data
  const fetchPayouts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payouts');
      if (!response.ok) {
        throw new Error('Failed to fetch payout data');
      }
      const data: PayoutsResponse = await response.json();
      setData(data);
    } catch (err) {
      setError((err as Error).message);
      // Show error toast
      console.error("Failed to load earnings data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPayouts();
  }, []);

  // Handle missing banking details
  const handleAddBankingDetails = () => {
    router.push('/dashboard/business/banking-details');
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-2 text-lg">Loading earnings data...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
        <p className="text-gray-600">{error}</p>
        <button 
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          onClick={fetchPayouts}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Render missing banking details warning
  if (data && !isBankingComplete(data.bankingDetails)) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="border border-red-300 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-4 py-3 border-b border-red-300">
            <h2 className="text-xl font-semibold text-red-600">Banking Details Required</h2>
            <p className="text-sm text-gray-600">
              You need to add your banking details to receive payments from Boleka.
            </p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="mb-4">
              Before you can receive payments for your rentals, you need to set up your banking details.
              This allows us to transfer your earnings (minus the 5% platform fee) to your account.
            </p>
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <h3 className="font-semibold mb-2">Required Information:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Bank Name</li>
                <li>Account Number</li>
                <li>Account Type</li>
                <li>Branch Code</li>
                <li>Account Holder Name</li>
              </ul>
            </div>
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                onClick={handleAddBankingDetails}
              >
                Add Banking Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main earnings dashboard
  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Business Earnings Dashboard</h1>
      
      {/* Platform Fee Information */}
      <div className="mb-8 bg-orange-50 border border-orange-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3">
          <h2 className="text-lg font-semibold">Platform Fee Information</h2>
        </div>
        <div className="px-4 py-3">
          <p className="text-sm mb-2">
            Boleka charges a 5% platform fee on all transactions. This fee is automatically deducted from each payment you receive.
          </p>
          <p className="text-sm">
            For example, if a customer pays R100 for your rental item, you&apos;ll receive R95 in your account, and R5 goes to Boleka as a platform fee.
          </p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="pb-2">
            <h3 className="text-base font-medium">Total Sales</h3>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(data?.summary?.totalAmount || 0)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="pb-2">
            <h3 className="text-base font-medium">Platform Fee (5%)</h3>
            <p className="text-xs text-gray-600">Fee paid to Boleka</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(data?.summary?.totalCommission || 0)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="pb-2">
            <h3 className="text-base font-medium">Your Net Earnings</h3>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(data?.summary?.totalMerchantAmount || 0)}</p>
          </div>
        </div>
      </div>
      
      {/* Banking Information */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">Banking Details</h3>
          <p className="text-sm text-gray-600">
            Your earnings will be paid to this account
          </p>
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Bank Name</p>
              <p className="font-medium">{data?.bankingDetails?.bankName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Number</p>
              <p className="font-medium">
                {data?.bankingDetails?.accountNumber 
                  ? `****${data.bankingDetails.accountNumber.slice(-4)}` 
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Type</p>
              <p className="font-medium">{data?.bankingDetails?.accountType || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Holder</p>
              <p className="font-medium">{data?.bankingDetails?.accountHolderName || 'Not set'}</p>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t">
          <button 
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300"
            onClick={handleAddBankingDetails}
          >
            Update Banking Details
          </button>
        </div>
      </div>
      
      {/* Payment History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h3 className="text-lg font-semibold">Payment History</h3>
          <p className="text-sm text-gray-600">
            All transactions including platform fees and payouts
          </p>
        </div>
        <div className="px-4 py-3">
          {data?.pendingPayouts && data.pendingPayouts.length > 0 ? (
            <div className="space-y-4">
              {data.pendingPayouts.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{payment.request.item.title}</h3>
                      <p className="text-sm text-gray-600">
                        Payment from {payment.payer.name} on {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${payment.merchantPaid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                      {payment.merchantPaid ? "Paid Out" : "Pending Payout"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Sale Amount</p>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Platform Fee (5%)</p>
                      <p className="font-medium">{formatCurrency(payment.commissionAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Your Net Earnings</p>
                      <p className="font-medium">{formatCurrency(payment.merchantAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No payment history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
