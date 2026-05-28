'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  item?: { title?: string; images?: string[] };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => setOrders(Array.isArray(data) ? data : data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-50 text-blue-700';
      case 'completed': return 'bg-green-50 text-green-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const filtered = orders.filter(o =>
    tab === 'active'
      ? ['active', 'pending', 'confirmed'].includes(o.status)
      : ['completed', 'cancelled', 'returned'].includes(o.status)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Rentals</h1>
        <p className="text-gray-500 text-sm mt-1">Track your rental orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
            tab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
            tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          History
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No {tab} rentals found</p>
            <Link
              href="/dashboard/items"
              className="mt-4 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
            >
              Browse items to rent
            </Link>
          </div>
        ) : (
          filtered.map((order) => (
            <Link
              key={order.id}
              href={`/dashboard/orders/${order.id}`}
              className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {order.item?.images?.[0] ? (
                    <img src={order.item.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {order.item?.title || 'Rental Item'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      R{order.total?.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
