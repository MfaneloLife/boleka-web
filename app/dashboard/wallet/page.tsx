'use client';

import { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  status: string;
}

interface WalletData {
  availableBalance: number;
  pendingBalance: number;
  paidOutTotal: number;
  totalBalance: number;
  completedSalesTotal: number;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch('/api/wallet'),
        fetch('/api/wallet/transactions'),
      ]);
      if (walletRes.ok) {
        const data = await walletRes.json();
        setWallet(data.wallet || { availableBalance: 0, pendingBalance: 0, paidOutTotal: 0, totalBalance: 0, completedSalesTotal: 0 });
        setTransactions((data.payments || []).map((p: any) => ({
          id: p.id,
          type: 'credit',
          amount: p.amount,
          description: `Payment for request #${p.requestId?.slice(-6) || p.id.slice(-6)}`,
          createdAt: p.createdAt,
          status: p.status,
        })));
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.transactions?.length > 0) {
          setTransactions(txData.transactions);
        }
      }
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your earnings and payments</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-white/80" />
          <span className="text-sm text-white/80">Available Balance</span>
        </div>
        <p className="text-4xl font-extrabold mb-4">
          {loading ? '...' : `R${(wallet?.availableBalance || 0).toFixed(2)}`}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium transition opacity-60 cursor-not-allowed">
            <ArrowUpRight className="w-4 h-4" /> Send
          </button>
          <button className="flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium transition opacity-60 cursor-not-allowed">
            <ArrowDownLeft className="w-4 h-4" /> Withdraw
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {wallet && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-lg font-bold text-gray-900">R{wallet.pendingBalance.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-lg font-bold text-gray-900">R{wallet.completedSalesTotal.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Sales</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-lg font-bold text-gray-900">R{wallet.paidOutTotal.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Paid Out</p>
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Payments</h2>
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" /></div>
          ) : transactions.length === 0 ? (
            <div className="p-10 text-center">
              <Wallet className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No payments yet</p>
              <p className="text-xs text-gray-300 mt-1">Your earnings will appear here</p>
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                    {tx.type === 'credit'
                      ? <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      : <ArrowUpRight className="w-4 h-4 text-red-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description || 'Payment'}</p>
                    <p className="text-xs text-gray-400">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'credit' ? '+' : '-'}R{(tx.amount || 0).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
