"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/src/lib/firebase';
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

// Legacy route – redirect to /dashboard/business/wallet for backward compatibility
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
      // Prefer sending Firebase token to server
      const user = auth.currentUser;
      const headers: Record<string, string> = {};
      if (user) {
        try {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
          if (user.email) headers['x-user-email'] = user.email;
        } catch {}
      }
      // Last-resort fallback: try to send cached email if auth.currentUser isn't set yet
      if (!headers['x-user-email']) {
        try {
          const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('boleka_user_email') : null;
          if (storedEmail) headers['x-user-email'] = storedEmail;
        } catch {}
      }
      const response = await fetch('/api/payouts', { headers });
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

  // Immediately redirect on client side
  if (typeof window !== 'undefined') {
    router.replace('/dashboard/business/wallet');
  }
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-orange-600 mr-2" />
      <span className="text-sm text-gray-600">Redirecting to Wallet...</span>
    </div>
  );
}
