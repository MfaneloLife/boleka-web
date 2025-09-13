"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, DollarSign, TrendingUp, Calendar } from 'lucide-react';

type Payment = {
  id: string;
  amount: number;
  commissionAmount: number;
  merchantAmount: number;
  status: string;
  merchantPaid: boolean;
  merchantPayoutDate: string | null;
  createdAt: any;
  updatedAt: any;
  request?: {
    id: string;
    item: {
      id: string;
      name: string;
      title: string;
    };
  };
  payer?: {
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
  payments: Payment[];
  summary: {
    count: number;
    totalAmount: number;
    totalCommission: number;
    totalMerchantAmount: number;
  };
  bankingDetails: BankingDetails;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Unknown';
  
  let date;
  if (timestamp.seconds) {
    // Firebase timestamp
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
              This allows us to transfer your earnings (minus the 8% platform fee) to your account.
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
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Earnings</h1>
          <p className="text-gray-600 mt-1">Track your rental income and PayFast transactions</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/business/banking-details')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Update Banking Details
        </button>
      </div>
      
      {/* Platform Fee Information */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">PayFast Integration & Platform Fee</h2>
            <p className="text-sm text-gray-600 mt-1">
              All payments are processed securely through PayFast. Boleka charges a 8% platform fee on successful transactions.
            </p>
            <div className="mt-3 text-sm text-gray-700">
              <span className="font-medium">Example:</span> Customer pays R100 → You receive R92 → Boleka fee R8
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary?.count || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data?.summary?.totalAmount || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Platform Fee (8%)</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(data?.summary?.totalCommission || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 text-red-600 font-bold text-lg">%</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Your Net Earnings</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data?.summary?.totalMerchantAmount || 0)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Banking Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Banking Details</h3>
              <p className="text-sm text-gray-600">Your earnings will be transferred to this account</p>
            </div>
            <button 
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              onClick={handleAddBankingDetails}
            >
              Update Details
            </button>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bank Name</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{data?.bankingDetails?.bankName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Number</p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {data?.bankingDetails?.accountNumber 
                  ? `****${data.bankingDetails.accountNumber.slice(-4)}` 
                  : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Type</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{data?.bankingDetails?.accountType || 'Not set'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account Holder</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{data?.bankingDetails?.accountHolderName || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment History - All Successful Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            All successful payments processed through PayFast
          </p>
        </div>
        <div className="px-6 py-4">
          {data?.payments && data.payments.length > 0 ? (
            <div className="space-y-4">
              {data.payments.map((payment) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {payment.request?.item?.name || payment.request?.item?.title || 'Item Rental'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Payment from {payment.payer?.name || 'Customer'} • {formatDate(payment.createdAt)}
                      </p>
                      {payment.payer?.email && (
                        <p className="text-xs text-gray-500">{payment.payer.email}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'COMPLETED' || payment.status === 'PAID'
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {payment.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.merchantPaid 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {payment.merchantPaid ? "Paid Out" : "Pending Payout"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Total Sale</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Platform Fee</p>
                      <p className="font-semibold text-red-600">-{formatCurrency(payment.commissionAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Your Earnings</p>
                      <p className="font-semibold text-green-600">{formatCurrency(payment.merchantAmount)}</p>
                    </div>
                  </div>
                  
                  {payment.merchantPayoutDate && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600">
                        <strong>Paid out:</strong> {formatDate(payment.merchantPayoutDate)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't received any payments yet. Start listing items to begin earning!
              </p>
              <button
                onClick={() => router.push('/dashboard/business/items')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                List Your First Item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
