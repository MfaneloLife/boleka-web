"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, Package, MapPin, Heart, WifiOff } from "lucide-react";
import { useOfflineItems } from "@/src/hooks/useOfflineItems";
import ShareButton from "@/src/components/ShareButton";
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

export default function ItemsGrid() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded: authLoaded } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const nextCursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Offline caching
  const { isOffline, showingCached, updateCache, getCachedFallback } = useOfflineItems<Item>();

  /** Map of itemId → favourited boolean */
  const [favMap, setFavMap] = useState<Record<string, boolean>>({});
  /** Set of itemIds being toggled (optimistic in-flight) */
  const toggling = useRef<Set<string>>(new Set());

  // Derive filters from URL search params
  const category = searchParams.get("category") || "";
  const searchQuery = searchParams.get("q") || "";

  /* ---------- fetch items (initial & paginated) ---------- */
  const fetchItems = useCallback(
    async (cursor?: string | null) => {
      const url = new URL("/api/items", window.location.origin);
      url.searchParams.set("limit", "12");
      if (cursor) url.searchParams.set("cursor", cursor);
      if (category) url.searchParams.set("category", category);
      if (searchQuery) url.searchParams.set("q", searchQuery);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    [category, searchQuery],
  );

  /* ---------- initial load + reset when filters change ---------- */
  useEffect(() => {
    setItems([]);
    nextCursorRef.current = null;
    setHasMore(true);
    setLoadingMore(false);

    const loadInitial = async () => {
      try {
        setLoading(true);
        const data = await fetchItems();
        const fetchedItems: Item[] = data.items || [];
        setItems(fetchedItems);
        updateCache(fetchedItems);
        nextCursorRef.current = data.nextCursor ?? null;
        setHasMore(!!data.nextCursor);
      } catch {
        // Try falling back to cache
        const cached = getCachedFallback();
        if (cached.length > 0) {
          setItems(cached);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, [fetchItems, updateCache, getCachedFallback]);

  /* ---------- infinite scroll observer ---------- */
  useEffect(() => {
    if (!hasMore || loading) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !loadingMore && hasMore) {
          const cursor = nextCursorRef.current;
          if (!cursor) return;

          setLoadingMore(true);
          fetchItems(cursor)
            .then((data) => {
              const newItems: Item[] = data.items || [];
              setItems((prev) => {
                const merged = [...prev, ...newItems];
                updateCache(merged);
                return merged;
              });
              nextCursorRef.current = data.nextCursor ?? null;
              setHasMore(!!data.nextCursor);
            })
            .catch(() => {
              // silent — keep existing items
            })
            .finally(() => {
              setLoadingMore(false);
            });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchItems, updateCache]);

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
      const intendedUrl = "/";
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
        setFavMap((prev) => ({ ...prev, [itemId]: body.favourited }));
      } else {
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

  return (
    <section className="px-4 py-8 bg-white">
      {/* Offline banner */}
      {(isOffline || showingCached) && (
        <div className="max-w-7xl mx-auto mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          <span>You are offline. Showing cached items.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto mb-4">
        {searchQuery ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">
              Results for "{searchQuery}"{category ? ` in ${category}` : ""}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} found</p>
          </>
        ) : category ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} found</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900">Recently Listed</h2>
            <p className="text-sm text-gray-500 mt-0.5">Browse items available for rent</p>
          </>
        )}
      </div>
      {items.length === 0 ? (
        <div className="text-center py-10">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            No items found{category ? ` in this category` : ""}{searchQuery ? ` for "${searchQuery}"` : ""}.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-7xl mx-auto">
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
                  {/* Price badge — bottom-left overlay */}
                  <div className="absolute bottom-2 left-2 z-10">
                    <PriceDisplay
                      itemType={item.itemType}
                      price={item.price}
                      rentalPrice={item.rentalPrice}
                      variant="badge"
                    />
                  </div>
                  {item.quantity <= 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Out of Stock
                    </div>
                  )}
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
                  {/* Floating action buttons — top-right overlay */}
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

          {/* Infinite scroll sentinel & loading indicator */}
          {hasMore && !isOffline && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {loadingMore && <Loader2 className="w-6 h-6 animate-spin text-orange-500" />}
            </div>
          )}
        </>
      )}
    </section>
  );
}