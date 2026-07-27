"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, Package, MapPin, Heart } from "lucide-react";
import ShareButton from "@/src/components/ShareButton";

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
  const router = useRouter();
  const { user, isLoaded: authLoaded } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  /** Map of itemId → favourited boolean */
  const [favMap, setFavMap] = useState<Record<string, boolean>>({});
  /** Set of itemIds being toggled (optimistic in-flight) */
  const toggling = useRef<Set<string>>(new Set());

  /* ---------- fetch items ---------- */
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

  /* ---------- fetch user's favourite item IDs ---------- */
  useEffect(() => {
    if (!authLoaded || !user) return;
    const fetchFavourites = async () => {
      try {
        const res = await fetch("/api/favourites");
        if (res.ok) {
          const data: { item: { id: string } }[] = await res.json();
          const map: Record<string, boolean> = {};
          data.forEach((fav) => { map[fav.item.id] = true; });
          setFavMap(map);
        }
      } catch {
        // silent
      }
    };
    fetchFavourites();
  }, [authLoaded, user]);

  /* ---------- toggle favourite (optimistic) ---------- */
  const handleToggleFav = async (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      const intendedUrl = `/`;
      router.push(`/auth/login?redirect_url=${encodeURIComponent(intendedUrl)}`);
      return;
    }

    // Prevent double-taps while API is in flight for this item
    if (toggling.current.has(itemId)) return;
    toggling.current.add(itemId);

    const currentlyFav = favMap[itemId] ?? false;

    // Optimistic update
    setFavMap((prev) => ({ ...prev, [itemId]: !currentlyFav }));

    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        const body = await res.json();
        // Reconcile with server truth
        setFavMap((prev) => ({ ...prev, [itemId]: body.favourited }));
      } else {
        // Revert on failure
        setFavMap((prev) => ({ ...prev, [itemId]: currentlyFav }));
      }
    } catch {
      setFavMap((prev) => ({ ...prev, [itemId]: currentlyFav }));
    } finally {
      toggling.current.delete(itemId);
    }
  };

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
              {/* Floating action buttons */}
              <div className="absolute top-2 right-2 z-10 flex gap-1.5">
                <ShareButton itemId={item.id} compact />
                <button
                  onClick={(e) => handleToggleFav(e, item.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:bg-white hover:shadow-md"
                  aria-label={favMap[item.id] ? "Remove from favourites" : "Add to favourites"}
                >
                  <Heart
                    className={`w-4 h-4 transition-all duration-200 ${
                      favMap[item.id]
                        ? "fill-orange-500 stroke-orange-500 scale-110"
                        : "fill-none stroke-slate-500 hover:stroke-orange-400 hover:scale-110"
                    }`}
                  />
                </button>
              </div>
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