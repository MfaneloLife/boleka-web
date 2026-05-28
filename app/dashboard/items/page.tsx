'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Plus, Package, Edit, Eye, Search } from 'lucide-react';

interface Item {
  id: string;
  title: string;
  price: number;
  status: string;
  images?: string[];
}

export default function MyShopPage() {
  const { user } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => setItems(Array.isArray(data) ? data : data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Shop</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your listed items</p>
        </div>
        <Link
          href="/dashboard/items/new"
          className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Link>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading your items...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No items yet</h2>
          <p className="text-sm text-gray-500 mb-6">Start listing items to rent or sell</p>
          <Link
            href="/dashboard/items/new"
            className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            List your first item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="aspect-[4/3] bg-gray-100 relative">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                  item.status === 'available' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                }`}>
                  {item.status}
                </span>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">From R{item.price}/day</p>
                <div className="flex items-center gap-2 mt-2">
                  <Link
                    href={`/dashboard/items/${item.id}`}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 py-1.5 rounded-lg transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Link>
                  <Link
                    href={`/dashboard/items/${item.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 py-1.5 rounded-lg transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
