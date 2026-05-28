'use client';

import { useEffect, useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const { user, isLoaded } = useUser();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wallet')
      .then(res => res.json())
      .then(data => {
        setBalance(data.balance || 0);
        setTransactions(data.transactions || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          R{balance.toFixed(2)}
        </p>
        <div className="flex gap-3">
          <Link
            href="/wallet/pay"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            Send
          </Link>
          <Link
            href="/wallet/payout"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Withdraw
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/wallet/topup" className="bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition-all">
          <p className="text-sm font-semibold text-gray-900">Top Up</p>
          <p className="text-xs text-gray-500 mt-0.5">Add money to wallet</p>
        </Link>
        <Link href="/wallet/history" className="bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 transition-all">
          <p className="text-sm font-semibold text-gray-900">History</p>
          <p className="text-xs text-gray-500 mt-0.5">View all transactions</p>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
          <button onClick={() => window.location.reload()} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-5 text-center text-gray-400 text-sm">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-5 text-center">
              <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No transactions yet</p>
              <p className="text-xs text-gray-300 mt-1">Your payments will appear here</p>
            </div>
          ) : (
            transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.type === 'credit' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className={`w-4 h-4 text-green-600`} />
                    ) : (
                      <ArrowUpRight className={`w-4 h-4 text-red-600`} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {tx.type === 'credit' ? '+' : '-'}R{tx.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
