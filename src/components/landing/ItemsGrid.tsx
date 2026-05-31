"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Package, MapPin } from "lucide-react";

interface Item {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  quantity: number;
  imageUrl: string | null;
  imageUrls: string[];
  location: string | null;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
}

export default function ItemsGrid() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/items");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setItems((data.items || []).slice(0, 12));
      } catch {
        // Silently fail — not critical for landing page
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  if (loading) {
    return (
      <section className="px-4 py-8 bg-white">
        <div className="max-w-7xl mx-auto mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recently Listed</h2>
          <p className="text-sm text-gray-500 mt-0.5">Browse items available for rent</p>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="px-4 py-8 bg-white">
      <div className="max-w-7xl mx-auto mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recently Listed</h2>
        <p className="text-sm text-gray-500 mt-0.5">Browse items available for rent</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-7xl mx-auto">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/items/${item.id}`}
            className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            {/* Image */}
            <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
              {item.imageUrl || item.imageUrls?.[0] ? (
                <img
                  src={item.imageUrl || item.imageUrls[0]}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-8 h-8 text-gray-300" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-800 px-2 py-0.5 rounded-full">
                R{item.price.toFixed(0)}/day
              </div>
              {item.quantity <= 0 && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Out of Stock
                </div>
              )}
            </div>
            {/* Details */}
            <div className="p-2.5">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                {item.title}
              </p>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{item.location || "South Africa"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {items.length >= 12 && (
        <div className="text-center mt-6">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 transition"
          >
            View all items →
          </Link>
        </div>
      )}
    </section>
  );
}