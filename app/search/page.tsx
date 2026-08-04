"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Search,
  ArrowLeft,
  ImageIcon,
  SlidersHorizontal,
  X,
  ChevronDown,
  MapPin,
  Package,
} from "lucide-react";
import AppShell from "@/src/components/layout/AppShell";
import { CATEGORY_SLUG_MAP, slugToLabel } from "@/lib/search-filters";
import PriceDisplay from "@/src/components/PriceDisplay";

interface Item {
  id: string;
  title: string;
  description: string | null;
  price: number;
  itemType: string;
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

const ITEM_TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "RENTING", label: "Rental" },
  { value: "SELLING", label: "For Sale" },
  { value: "BOTH", label: "Rent & Sell" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "relevant", label: "Most Relevant" },
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const searchQuery = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";
  const categoryLabel = categorySlug ? slugToLabel(categorySlug) : "";

  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // Filter state
  const [sort, setSort] = useState("newest");
  const [itemType, setItemType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [location, setLocation] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const displayTitle = searchQuery
    ? categoryLabel
      ? `"${searchQuery}" in ${categoryLabel}`
      : `Results for "${searchQuery}"`
    : categoryLabel
      ? `Category: ${categoryLabel}`
      : "All Items";

  const hasFilters =
    sort !== "newest" || itemType !== "" || minPrice !== "" || maxPrice !== "" || location !== "";

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (categorySlug) params.set("category", categorySlug);
      if (sort) params.set("sort", sort);
      if (itemType) params.set("itemType", itemType);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (location) params.set("location", location);
      params.set("page", String(page));
      params.set("limit", "24");

      const res = await fetch(`/api/items/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } catch (err) {
      console.error("search error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categorySlug, sort, itemType, minPrice, maxPrice, location, page]);

  useEffect(() => {
    setPage(1);
    fetchItems();
  }, [searchQuery, categorySlug, sort, itemType, minPrice, maxPrice, location]);

  useEffect(() => {
    if (page > 1) {
      fetchItems();
    }
  }, [page]);

  const clearFilters = () => {
    setSort("newest");
    setItemType("");
    setMinPrice("");
    setMaxPrice("");
    setLocation("");
  };

  const buildUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    return `/search?${params.toString()}`;
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-[57px] z-10">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {displayTitle}
                </h1>
                <p className="text-xs text-gray-500">
                  {loading ? "Searching..." : `${total} item${total !== 1 ? "s" : ""} found`}
                </p>
              </div>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`p-2 rounded-lg transition flex items-center gap-1 text-sm ${
                  filtersOpen || hasFilters
                    ? "bg-orange-50 text-orange-600"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
                aria-label="Toggle filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">Filters</span>
              </button>
            </div>

            {/* Filter Bar */}
            {filtersOpen && (
              <div className="border-t border-gray-100 mt-3 pt-3 pb-1">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Sort */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                      Sort By
                    </label>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-200 px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Listing Type */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                      Listing Type
                    </label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-200 px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      {ITEM_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Min */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                      Min Price (R)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-200 px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>

                  {/* Price Max */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                      Max Price (R)
                    </label>
                    <input
                      type="number"
                      placeholder="Any"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-200 px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>

                  {/* Location */}
                  <div className="col-span-2 sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="e.g. Johannesburg"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full text-sm rounded-lg border border-gray-200 pl-9 pr-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                    </div>
                  </div>
                </div>

                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-xs font-medium text-orange-600 hover:text-orange-700 transition inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {loading ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
              <p className="text-gray-400 text-sm">Searching items...</p>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="text-center py-20">
              <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-1">No items found</h2>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `We couldn't find any items matching "${searchQuery}".${
                      categoryLabel ? ` Try browsing all items in ${categoryLabel} instead.` : ""
                    }`
                  : categoryLabel
                    ? `No items listed under ${categoryLabel} at the moment.`
                    : "No items match your current filters."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {searchQuery && (
                  <Link
                    href={categorySlug ? `/search?category=${categorySlug}` : "/search"}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    <X className="w-4 h-4" />
                    Clear Search
                  </Link>
                )}
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 bg-orange-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition shadow-sm"
                >
                  <Package className="w-4 h-4" />
                  Browse All Items
                </Link>
              </div>

              {/* Suggested Categories */}
              <div className="mt-10">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Popular Categories</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(CATEGORY_SLUG_MAP)
                    .slice(0, 6)
                    .map(([slug, label]) => (
                      <Link
                        key={slug}
                        href={`/search?category=${slug}`}
                        className="text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      >
                        {label}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Results Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}`}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : item.imageUrls?.[0] ? (
                        <img
                          src={item.imageUrls[0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      {/* Price badge */}
                      <div className="absolute bottom-2 left-2 z-10">
                        <PriceDisplay
                          itemType={item.itemType}
                          price={item.price}
                          variant="badge"
                        />
                      </div>
                      {/* Item type badge */}
                      {item.itemType && item.itemType !== "SELLING" && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {item.itemType === "RENTING"
                            ? "Rent"
                            : item.itemType === "BOTH"
                              ? "Rent + Buy"
                              : ""}
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 sm:p-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <div className="mt-0.5">
                        <PriceDisplay
                          itemType={item.itemType}
                          price={item.price}
                          variant="inline"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-4 h-4 rounded-full bg-gray-200 overflow-hidden shrink-0">
                          {item.user?.image ? (
                            <img src={item.user.image} alt="" className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <span className="text-xs text-gray-400 truncate">{item.user?.name || "User"}</span>
                      </div>
                      {item.location && (
                        <p className="text-[10px] text-gray-400 mt-1 truncate">📍 {item.location}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition shadow-sm"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Load More Items
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}