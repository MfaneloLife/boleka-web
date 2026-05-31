"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Store, Star, ImageIcon, Loader2 } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  image: string | null;
  location: string;
  itemCount: number;
  rating: number;
  featuredItems: {
    id: string;
    title: string;
    price: number;
    imageUrl: string | null;
    category: string;
  }[];
}

export default function ShopsTab() {
  const { isLoaded } = useUser();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shops");
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
      }
    } catch (err) {
      console.error("shops error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isLoaded) {
    return (
      <div className="px-4 py-6 bg-white min-h-[60vh]">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shops</h2>
        <p className="text-gray-500 mb-6">Discover trusted vendors and their items</p>
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
          <p className="text-gray-400 text-sm">Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 bg-white min-h-[60vh]">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shops</h2>
        <p className="text-gray-500">Discover trusted vendors and their items</p>
      </div>

      {shops.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-2xl flex items-center justify-center">
            <Store className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No shops yet</h3>
          <p className="text-gray-500 mb-6">
            Be the first to list items and become a featured shop.
          </p>
          <Link
            href="/dashboard/items?action=list"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300"
          >
            <Store className="w-5 h-5" />
            Start Your Shop
          </Link>
        </div>
      ) : (
        <>
          {/* Popular shops */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Popular shops</h3>
            <div className="space-y-4">
              {shops.map((shop) => (
                <div key={shop.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0">
                      {shop.image ? (
                        <img src={shop.image} alt={shop.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{shop.name}</p>
                      <p className="text-xs text-gray-500">
                        {shop.location && `${shop.location} · `}{shop.itemCount} item{shop.itemCount !== 1 ? "s" : ""}
                      </p>
                      {shop.rating > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-gray-600">{shop.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {shop.featuredItems.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
                      {shop.featuredItems.map((item) => (
                        <Link
                          key={item.id}
                          href={`/items/${item.id}`}
                          className="flex-shrink-0 w-28 group"
                        >
                          <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="w-6 h-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-medium text-gray-900 mt-1.5 truncate">{item.title}</p>
                          <p className="text-xs text-gray-500">R{item.price?.toFixed(2)}/day</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Category badges */}
      <div className="mt-8">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Browse by category</h4>
        <div className="flex flex-wrap gap-2">
          {[
            "Electronics", "Home & Garden", "Fashion", "Sports & Leisure",
            "Vehicles", "Books & Media", "Events & Catering", "Tools & Equipment",
            "Baby & Kids", "Local Design",
          ].map((cat) => (
            <Link
              key={cat}
              href={`/search?q=${encodeURIComponent(cat)}`}
              className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}