"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, ArrowLeft, ImageIcon, WifiOff, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import AppShell from "@/src/components/layout/AppShell";
import { slugToLabel, CATEGORY_SLUG_MAP } from "@/lib/search-filters";
import { useOfflineItems } from "@/src/hooks/useOfflineItems";

interface Item {
  id: string;
  title: string;
  description: string | null;
  price: number;
  rentalPrice: number | null;
  itemType: string | null;
  category: string;
  condition: string;
  imageUrl: string | null;
  imageUrls: string[];
  location: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

function priceLabel(item: Pick<Item, "itemType" | "price" | "rentalPrice">): string {
  const isRental =
    item.itemType === "RENTING" ||
    item.itemType === "BOTH" ||
    (!item.itemType && item.rentalPrice !== null && item.rentalPrice !== undefined);
  const displayPrice = item.rentalPrice ?? item.price;
  return isRental ? `R${displayPrice.toFixed(2)}/day` : `R${displayPrice.toFixed(2)}`;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const locationFilter = searchParams.get("location") || "";
  const sortParam = searchParams.get("sort") || "newest";
  const minPriceParam = searchParams.get("minPrice") || "";
  const maxPriceParam = searchParams.get("maxPrice") || "";

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [localMinPrice, setLocalMinPrice] = useState(minPriceParam);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPriceParam);

  const { isOffline, showingCached, updateCache, getCachedFallback } = useOfflineItems<Item>();

  const categoryLabel = categorySlug ? slugToLabel(categorySlug) : "";

  const displayTitle = searchQuery
    ? `"${searchQuery}"${categoryLabel ? ` in ${categoryLabel}` : ""}`
    : categoryLabel || "Browse Items";

  // Active filter chips
  const activeFilters: { key: string; label: string; remove: () => void }[] = [];
  if (categorySlug) {
    activeFilters.push({ key: "category", label: categoryLabel, remove: () => removeParam("category") });
  }
  if (locationFilter) {
    activeFilters.push({ key: "location", label: locationFilter, remove: () => removeParam("location") });
  }
  if (minPriceParam || maxPriceParam) {
    const label = `${minPriceParam ? "R"+minPriceParam : "R0"}–${maxPriceParam ? "R"+maxPriceParam : ""}`;
    activeFilters.push({ key: "price", label, remove: () => { removeParam("minPrice"); removeParam("maxPrice"); } });
  }

  function removeParam(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/");
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    if (localMinPrice) params.set("minPrice", localMinPrice); else params.delete("minPrice");
    if (localMaxPrice) params.set("maxPrice", localMaxPrice); else params.delete("maxPrice");
    router.push(`/search?${params.toString()}`);
    setShowFilters(false);
  }

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "newest") params.set("sort", value); else params.delete("sort");
    router.push(`/search?${params.toString()}`);
    setShowSort(false);
  }

  const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "relevance", label: "Relevance" },
  ];

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("q", searchQuery);
        if (categorySlug) params.set("category", categorySlug);
        if (locationFilter) params.set("location", locationFilter);
        if (minPriceParam) params.set("minPrice", minPriceParam);
        if (maxPriceParam) params.set("maxPrice", maxPriceParam);
        if (sortParam && sortParam !== "newest") params.set("sort", sortParam);

        const res = await fetch(`/api/items?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedItems: Item[] = data.items || [];
          setItems(fetchedItems);
          updateCache(fetchedItems);
        } else {
          throw new Error("Failed to fetch");
        }
      } catch {
        const cached = getCachedFallback();
        if (cached.length > 0) {
          setItems(cached);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categorySlug, locationFilter, minPriceParam, maxPriceParam, sortParam]);

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 transition shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate capitalize">
                {displayTitle}
              </h1>
              <p className="text-xs text-gray-500">
                {loading ? "Searching..." : `${items.length} item${items.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto scrollbar-none">
              {activeFilters.map((f) => (
                <span key={f.key} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full shrink-0">
                  {f.label}
                  <button onClick={f.remove} className="hover:bg-orange-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </span>
              ))}
              <button onClick={() => router.push("/search")} className="text-xs text-gray-500 hover:text-gray-700 underline shrink-0">Clear all</button>
            </div>
          )}

          {/* Filter & Sort bar */}
          <div className="flex items-center gap-2 px-4 pb-2">
            <button onClick={() => setShowFilters(true)} className="inline-flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {(minPriceParam || maxPriceParam || locationFilter) && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
            </button>
            <div className="relative">
              <button onClick={() => setShowSort(!showSort)} className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition">
                Sort: {SORT_OPTIONS.find((o) => o.value === sortParam)?.label || "Newest"}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 w-44">
                    {SORT_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => setSort(opt.value)} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${sortParam === opt.value ? "font-semibold text-orange-600" : "text-gray-700"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Offline banner */}
          {(isOffline || showingCached) && (
            <div className="max-w-7xl mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              <span>You are offline. Showing cached items.</span>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
              <p className="text-gray-400 text-sm">Loading items...</p>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">No items found</h2>
              <p className="text-sm text-gray-500 mb-6">
                {displayTitle !== "Browse Items" ? `No items found for "${displayTitle}".` : "Try searching for something."}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition shadow-sm"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            /* Items Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                >
                  {/* Image — taller portrait aspect ratio (Yaga style) */}
                  <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden rounded-t-xl">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : item.imageUrls?.[0] ? (
                      <img
                        src={item.imageUrls[0]}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                    {/* Price badge */}
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-800 px-2 py-0.5 rounded-full">
                      {priceLabel(item)}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{priceLabel(item)}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden shrink-0">
                        {item.user?.image ? (
                          <img src={item.user.image} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <span className="text-xs text-gray-400 truncate">{item.user?.name || "User"}</span>
                    </div>
                    {item.location && (
                      <p className="text-xs text-gray-400 mt-1 truncate">📍 {item.location}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}