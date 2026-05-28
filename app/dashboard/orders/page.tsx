'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Clock, CheckCircle, XCircle, ChevronRight, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface RequestItem {
  id: string;
  title: string;
  imageUrls: string[];
}

interface RequestParty {
  id: string;
  name: string | null;
  image: string | null;
}

interface RentalOrder {
  id: string;
  status: string;
  item: RequestItem;
  requester: RequestParty;
  owner: RequestParty;
  totalPrice?: number;
  startDate?: string;
  endDate?: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const { user, isLoaded } = useUser();
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    if (isLoaded && user) fetchOrders();
  }, [isLoaded, user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/requests');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.requests || []);
    } catch (err) {
      console.error('orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isActiveStatus = (status: string) =>
    ['PENDING', 'ACCEPTED', 'PAID'].includes(status.toUpperCase());

  const statusIcon = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PENDING') return <Clock className="w-4 h-4 text-amber-600" />;
    if (s === 'ACCEPTED' || s === 'PAID') return <Clock className="w-4 h-4 text-blue-600" />;
    if (s === 'COMPLETED') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (s === 'CANCELLED' || s === 'REJECTED') return <XCircle className="w-4 h-4 text-red-600" />;
    return <Package className="w-4 h-4 text-gray-600" />;
  };

  const statusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PENDING') return 'bg-amber-50 text-amber-700';
    if (s === 'ACCEPTED' || s === 'PAID') return 'bg-blue-50 text-blue-700';
    if (s === 'COMPLETED') return 'bg-green-50 text-green-700';
    if (s === 'CANCELLED' || s === 'REJECTED') return 'bg-red-50 text-red-700';
    return 'bg-gray-50 text-gray-600';
  };

  const statusLabel = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'PENDING') return 'Pending';
    if (s === 'ACCEPTED') return 'Accepted';
    if (s === 'PAID') return 'Paid';
    if (s === 'COMPLETED') return 'Completed';
    if (s === 'CANCELLED') return 'Cancelled';
    if (s === 'REJECTED') return 'Rejected';
    return status;
  };

  const filtered = orders.filter(o =>
    tab === 'active' ? isActiveStatus(o.status) : !isActiveStatus(o.status)
  );

  const getOtherParty = (order: RentalOrder) => {
    if (!user) return null;
    return order.requester.id === user.id ? order.owner : order.requester;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Rentals</h1>
        <p className="text-gray-500 text-sm mt-1">
          {orders.length > 0 ? `${orders.length} rental request${orders.length > 1 ? 's' : ''}` : 'Track your rental orders'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
            tab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({orders.filter(o => isActiveStatus(o.status)).length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
            tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          History ({orders.filter(o => !isActiveStatus(o.status)).length})
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-3" />
            <p className="text-gray-400 text-sm">Loading rentals...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-14 h-14 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm mb-1">No {tab} rentals found</p>
            <p className="text-xs text-gray-300 mb-4">Browse items to start renting</p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition shadow-sm"
            >
              Browse Items
            </Link>
          </div>
        ) : (
          filtered.map((order) => {
            const other = getOtherParty(order);
            return (
              <Link
                key={order.id}
                href={`/messages/${order.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-orange-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {order.item?.imageUrls?.[0] ? (
                      <img src={order.item.imageUrls[0]} alt="" className="w-full h-full object-cover" />
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
                        {statusLabel(order.status)}
                      </span>
                      {order.totalPrice && (
                        <span className="text-xs text-gray-400">
                          R{order.totalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {other?.name || 'User'} &middot; {new Date(order.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
