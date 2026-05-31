"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Navigation, Package, Loader2 } from "lucide-react";
import { useGeolocation } from "@/src/hooks/useGeolocation";

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
  lat: number | null;
  lng: number | null;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
}

export default function NearbyItems() {
  const { location, error: geoError, requestLocation } = useGeolocation();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRequest, setShowRequest] = useState(true);

  useEffect(() => {
    if (!location) return;

    const fetchNearby = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/items?lat=${location.latitude}&lng=${location.longitude}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setItems((data.items || []).slice(0, 8));
        setShowRequest(false);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchNearby();
  }, [location]);

  // If user hasn't shared location yet, show the request button
  if (showRequest && !location) {
    return (
      <section className="px-4 py-6 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-orange-100 p-6 text-center shadow-sm">
            <Navigation className="w-12 h-12 mx-auto text-orange-400 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Discover items near you
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              Share your location to see items available in your area first
            </p>
            <button
              onClick={requestLocation}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition shadow-sm"
            >
              <MapPin className="w-4 h-4" />
              Enable Location
            </button>
            {geoError && (
              <p className="text-xs text-red-500 mt-3">{geoError}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-3">
              Your location is only used to show nearby items
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Show loading
  if (loading) {
    return (
      <section className="px-4 py-6 bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        </div>
      </section>
    );
  }

  // No items nearby
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-6 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-orange-500" />
              Near You
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Items available in your area
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
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
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{item.location || "Nearby"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}