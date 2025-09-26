"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/src/lib/firebase';
import { Loader2, AlertCircle, Wallet, Banknote, TrendingUp, Hourglass, Star, ArrowDownToLine, ArrowUpFromLine, History } from 'lucide-react';

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
  request?: { id: string; item: { id: string; name: string; title: string } };
  payer?: { id: string; name: string; email: string };
};

type BankingDetails = {
  bankName: string | null;
  accountNumber: string | null;
  accountType: string | null;
  branchCode: string | null;
  accountHolderName: string | null;
};

type WalletData = {
  availableBalance: number;
  creditBalance: number;
  pendingBalance: number;
  completedSalesTotal: number;
  paidOutTotal: number;
  totalBalance: number;
};

type WalletResponse = {
  payments: Payment[];
  summary: any;
  wallet: WalletData;
  bankingDetails: BankingDetails;
  hasBusinessProfile?: boolean; // newly returned by API
};

type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  relatedPaymentId?: string;
  relatedOrderId?: string;
  relatedRequestId?: string;
  metadata?: any;
  createdAt: any;
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Unknown';
  let date; if (timestamp.seconds) date = new Date(timestamp.seconds * 1000); else if (timestamp instanceof Date) date = timestamp; else date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function WalletPage() {
  const [data, setData] = useState<WalletResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const isBankingComplete = (b: BankingDetails | null) => !!(b && b.bankName && b.accountNumber && b.accountType && b.branchCode && b.accountHolderName);

  const fetchWallet = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      const headers: Record<string,string> = {};
      if (user) {
        try {
          const token = await user.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
            if (user.email) headers['x-user-email'] = user.email;
        } catch {}
      }
      if (!headers['x-user-email']) {
        try { const stored = typeof window !== 'undefined' ? localStorage.getItem('boleka_user_email') : null; if (stored) headers['x-user-email'] = stored; } catch {}
      }
      const res = await fetch('/api/wallet', { headers });
      if (!res.ok) throw new Error('Failed to fetch wallet data');
      const json: WalletResponse = await res.json();
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally { setIsLoading(false); }
  };

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const user = auth.currentUser; const headers: Record<string,string> = {};
      if (user) { try { const token = await user.getIdToken(); headers['Authorization'] = `Bearer ${token}`; if (user.email) headers['x-user-email'] = user.email; } catch {} }
      if (!headers['x-user-email']) { try { const stored = localStorage.getItem('boleka_user_email'); if (stored) headers['x-user-email'] = stored; } catch {} }
      const res = await fetch('/api/wallet/transactions?limit=100', { headers });
      if (res.ok) { const j = await res.json(); setTransactions(j.transactions || []); }
    } finally { setTxLoading(false); }
  };

  const triggerPayout = async () => {
    setActionMsg(null);
    try {
      const user = auth.currentUser; const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (user) { const token = await user.getIdToken(); headers['Authorization'] = `Bearer ${token}`; if (user.email) headers['x-user-email'] = user.email; }
      const body: any = {};
      if (selectMode && selectedPaymentIds.size) body.paymentIds = Array.from(selectedPaymentIds);
      const res = await fetch('/api/wallet/payout', { method: 'POST', headers, body: JSON.stringify(body) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Payout failed');
      setActionMsg(`Payout requested: ${formatCurrency(j.payoutAmount || 0)}`);
      setSelectedPaymentIds(new Set());
      await fetchWallet();
      await fetchTransactions();
    } catch (e) { setActionMsg((e as Error).message); }
  };

  const spendTest = async () => {
    setActionMsg(null);
    try {
      const user = auth.currentUser; const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (user) { const token = await user.getIdToken(); headers['Authorization'] = `Bearer ${token}`; if (user.email) headers['x-user-email'] = user.email; }
      const res = await fetch('/api/wallet/spend', { method: 'POST', headers, body: JSON.stringify({ amount: 10, purpose: 'Test Spend' }) });
      const j = await res.json(); if (!res.ok) throw new Error(j.error || 'Spend failed');
      setActionMsg(`Spent R10. Remaining: ${formatCurrency(j.remaining || 0)}`);
      await fetchWallet(); await fetchTransactions();
    } catch (e) { setActionMsg((e as Error).message); }
  };

  useEffect(() => { fetchWallet(); fetchTransactions(); }, []);

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      <span className="ml-2 text-lg">Loading wallet...</span>
    </div>
  );

  if (error) return (
    <div className="flex h-[60vh] flex-col items-center justify-center">
      <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Error Loading Wallet</h2>
      <p className="text-gray-600">{error}</p>
      <button onClick={fetchWallet} className="mt-4 px-4 py-2 bg-orange-600 text-white rounded">Try Again</button>
    </div>
  );

  // Distinguish between: (1) no business profile yet, (2) business profile exists but missing banking details
  if (data && !data.hasBusinessProfile) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="border border-amber-300 rounded-lg overflow-hidden">
          <div className="bg-amber-50 px-4 py-3 border-b border-amber-300">
            <h2 className="text-xl font-semibold text-amber-700">Create Your Business Profile</h2>
            <p className="text-sm text-gray-600">Set up a business profile to start earning and unlock banking details & payouts.</p>
          </div>
          <div className="bg-white px-4 py-4 space-y-4">
            <p className="text-gray-700">You currently only have a client account. To receive payouts, list items, and view enhanced wallet analytics you need a business profile.</p>
            <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
              <li>Choose a business name & service area</li>
              <li>Add a contact number for renters</li>
              <li>Later: add banking details for withdrawals</li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
              <button onClick={() => router.push('/auth/profile-setup')} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Business Profile</button>
              <button onClick={fetchWallet} className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">Refresh</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data && data.hasBusinessProfile && !isBankingComplete(data.bankingDetails)) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="border border-red-300 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-4 py-3 border-b border-red-300">
            <h2 className="text-xl font-semibold text-red-600">Banking Details Required</h2>
            <p className="text-sm text-gray-600">Add banking details to withdraw available funds.</p>
          </div>
          <div className="bg-white px-4 py-3">
            <p className="mb-4">Provide your banking details so we can process payouts of your available wallet balance.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => router.push('/dashboard/business/profile')} className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">Edit Business Profile</button>
              <button onClick={() => router.push('/dashboard/business/banking-details')} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Add Banking Details</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-gray-600 mt-1">Manage your earnings, credits, and payouts</p>
        </div>
        <button onClick={() => router.push('/dashboard/business/banking-details')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Banking Details</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card label="Available" value={formatCurrency(data!.wallet.availableBalance)} icon={<Wallet className="w-5 h-5" />} accent="from-green-50 to-emerald-50" />
        <Card label="Credits" value={formatCurrency(data!.wallet.creditBalance)} icon={<Star className="w-5 h-5" />} accent="from-yellow-50 to-amber-50" />
        <Card label="Pending" value={formatCurrency(data!.wallet.pendingBalance)} icon={<Hourglass className="w-5 h-5" />} accent="from-orange-50 to-rose-50" />
        <Card label="Completed Sales" value={formatCurrency(data!.wallet.completedSalesTotal)} icon={<TrendingUp className="w-5 h-5" />} accent="from-blue-50 to-indigo-50" />
        <Card label="Paid Out" value={formatCurrency(data!.wallet.paidOutTotal)} icon={<Banknote className="w-5 h-5" />} accent="from-slate-50 to-gray-50" />
        <Card label="Total" value={formatCurrency(data!.wallet.totalBalance)} icon={<Wallet className="w-5 h-5" />} accent="from-purple-50 to-fuchsia-50" />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={triggerPayout} className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Withdraw (Payout)
        </button>
        <button onClick={spendTest} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">
          <ArrowUpFromLine className="w-4 h-4 mr-2" /> Spend R10 (Demo)
        </button>
        <button onClick={() => { setSelectMode(s => !s); setSelectedPaymentIds(new Set()); }} className={`inline-flex items-center px-4 py-2 text-sm rounded ${selectMode ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}> {selectMode ? 'Cancel Selection' : 'Select Payments'} </button>
        <button onClick={fetchTransactions} className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded hover:bg-gray-200">
          <History className="w-4 h-4 mr-2" /> Refresh History
        </button>
        {actionMsg && <span className="text-sm text-gray-600">{actionMsg}</span>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <p className="text-sm text-gray-600">Underlying payment records (credits & potential debits in future)</p>
        </div>
        <div className="px-6 py-4">
          {data?.payments?.length ? (
            <div className="space-y-4">
              {data.payments.map(p => {
                const selectable = ['COMPLETED','PAID'].includes(p.status) && !p.merchantPaid;
                const checked = selectedPaymentIds.has(p.id);
                return (
                <div key={p.id} className={`border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow ${selectMode && selectable ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (!selectMode || !selectable) return; 
                    setSelectedPaymentIds(prev => {
                      const next = new Set(prev);
                      if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                      return next;
                    });
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{p.request?.item?.name || p.request?.item?.title || 'Item Rental'}</h4>
                      <p className="text-sm text-gray-600 mt-1">{p.payer?.name || 'Customer'} • {formatDate(p.createdAt)}</p>
                      {p.payer?.email && <p className="text-xs text-gray-500">{p.payer.email}</p>}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {selectMode && selectable && (
                        <label className="inline-flex items-center gap-1 text-xs text-gray-600">
                          <input aria-label="Select payment" type="checkbox" className="h-4 w-4" onChange={() => { /* handled in wrapper */ }} checked={checked} readOnly />
                          Sel
                        </label>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${['COMPLETED','PAID'].includes(p.status) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.merchantPaid ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{p.merchantPaid ? 'Paid Out' : 'In Wallet'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Sale</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(p.amount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Platform Fee</p>
                      <p className="font-semibold text-red-600">-{formatCurrency(p.commissionAmount)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Net</p>
                      <p className="font-semibold text-green-600">{formatCurrency(p.merchantAmount)}</p>
                    </div>
                  </div>
                  {p.merchantPayoutDate && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600"><strong>Paid out:</strong> {formatDate(p.merchantPayoutDate)}</p>
                    </div>
                  )}
                </div>
              );})}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">No transactions yet.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center"><History className="w-5 h-5 mr-2 text-gray-500" /> Wallet Ledger</h3>
            <p className="text-sm text-gray-600">All wallet debits / credits (last {transactions.length} entries)</p>
          </div>
          {txLoading && <Loader2 className="h-5 w-5 animate-spin text-orange-600" />}
        </div>
        <div className="px-6 py-4 overflow-x-auto">
          {transactions.length ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const date = tx.createdAt?.seconds ? new Date(tx.createdAt.seconds * 1000) : new Date(tx.createdAt);
                  const isDebit = tx.type.startsWith('DEBIT');
                  return (
                    <tr key={tx.id} className="border-t border-gray-100">
                      <td className="py-2 pr-4 whitespace-nowrap">{date.toLocaleString()}</td>
                      <td className="py-2 pr-4"><span className={`px-2 py-1 rounded text-xs font-medium ${isDebit ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{tx.type}</span></td>
                      <td className="py-2 pr-4 font-medium {isDebit ? 'text-red-600' : 'text-green-700'}">{isDebit ? '-' : '+'}{formatCurrency(tx.amount)}</td>
                      <td className="py-2 pr-4 text-gray-600">
                        {tx.metadata?.purpose || tx.metadata?.reason || tx.metadata?.method || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-600 text-sm">No ledger entries yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, icon, accent }: { label: string; value: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className={`bg-gradient-to-br ${accent} rounded-xl border border-gray-200 p-4 flex flex-col justify-between`}> 
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold tracking-wide text-gray-600 uppercase">{label}</p>
        <div className="w-8 h-8 bg-white/70 backdrop-blur rounded flex items-center justify-center text-gray-700">{icon}</div>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
