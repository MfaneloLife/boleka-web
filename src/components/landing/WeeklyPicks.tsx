"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Loader2, Package, MapPin, WifiOff } from "lucide-react";
import { useOfflineItems } from "@/src/hooks/useOfflineItems";
import PriceDisplay from "@/src/components/PriceDisplay";

interface Item {
  id: string;
  title: string;
  description: string | null;
  price: number;
  rentalPrice: number | null;
  itemType: string | null;
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

/** Compute ISO week seed e.g. "2026-31" */
function getWeekSeed(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-${weekNum}`;
}

export default function WeeklyPicks() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const { isOffline, showingCached, updateCache, getCachedFallback } = useOfflineItems<Item>();

  useEffect(() => {
    const seed = getWeekSeed();
    const fetchPicks = async () => {
      try {
        setLoading(true);
        const url = new URL("/api/items", window.location.origin);
        url.searchParams.set("weekly", "true");
        url.searchParams.set("seed", seed);
        url.searchParams.set("limit", "8");
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          const fetchedItems: Item[] = data.items || [];
          setItems(fetchedItems);
          updateCache(fetchedItems);
        } else {
          throw new Error("Failed to fetch weekly picks");
        }
      } catch {
        const cached = getCachedFallback();
        if (cached.length > 0) {
          setItems(cached.slice(0, 8));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPicks();
  }, [updateCache, getCachedFallback]);

  if (loading) {
    return (
      <section className="px-4 py-6 bg-white">
        <div className="max-w-7xl mx-auto mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Weekly Picks</h2>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Curated items for you this week</p>
        </div>
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="px-4 py-6 bg-white">
      {/* Offline banner */}
      {(isOffline || showingCached) && (
        <div className="max-w-7xl mx-auto mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You are offline. Showing cached items.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">Weekly Picks</h2>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Curated items for you this week</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-7xl mx-auto">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/items/${item.id}`}
            className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            {/* Image — taller portrait aspect ratio (Yaga style) */}
            <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden rounded-t-xl">
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
              <div className="absolute bottom-2 left-2 z-10">
                <PriceDisplay
                  itemType={item.itemType}
                  price={item.price}
                  rentalPrice={item.rentalPrice}
                  variant="badge"
                />
              </div>
              {/* Item type badge */}
              {item.itemType && (
                <div
                  className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.itemType === "SELLING" ? "bg-green-600" : "bg-blue-600"
                  }`}
                >
                  {item.itemType === "SELLING" ? "Buy" : "Rent"}
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
    </section>
  );
}