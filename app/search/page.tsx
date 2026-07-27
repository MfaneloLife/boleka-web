"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, ArrowLeft, ImageIcon } from "lucide-react";
import AppShell from "@/src/components/layout/AppShell";
import { slugToLabel } from "@/lib/search-filters";

interface Item {
  id: string;
  title: string;
  description: string | null;
  price: number;
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

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Separate free-text query ("q") from category filter ("category")
  const searchQuery = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const displayTitle = searchQuery
    ? `"${searchQuery}"${categorySlug ? ` in ${slugToLabel(categorySlug)}` : ""}`
    : categorySlug
      ? slugToLabel(categorySlug)
      : "Browse Items";

  useEffect(() => {
    if (searchQuery || categorySlug) fetchItems();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categorySlug]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (categorySlug) params.set("category", categorySlug);

      const res = await fetch(`/api/items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-[57px] z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 truncate capitalize">
                {displayTitle}
              </h1>
              <p className="text-xs text-gray-500">
                {loading ? "Searching..." : `${items.length} item${items.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
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
                  <div className="aspect-square bg-gray-100 relative">
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
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">R{item.price.toFixed(2)}/day</p>
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