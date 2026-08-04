"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Store, Star, ImageIcon, Loader2, MapPin } from "lucide-react";
import { CATEGORY_SLUG_MAP } from "@/lib/search-filters";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://pub-0bf9994c37384a93b6f02dc5dc60ec44.r2.dev";

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string" || url.trim() === "") return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${R2_PUBLIC_URL}${trimmed}`;
  return `${R2_PUBLIC_URL}/${trimmed}`;
}

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

  // Build the category link list from the shared slug map
  const categoryEntries = Object.entries(CATEGORY_SLUG_MAP);

  if (loading || !isLoaded) {
    return (
      <div className="px-4 py-6 bg-white min-h-[60vh]">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Shops</h2>
        <p className="text-sm text-gray-500 mb-6">Discover trusted vendors and their items</p>
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
          <p className="text-gray-400 text-sm">Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 bg-white min-h-[60vh]">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Shops</h2>
        <p className="text-sm text-gray-500">Discover trusted vendors and their items</p>
      </div>

      {shops.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-2xl flex items-center justify-center">
            <Store className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No shops yet</h3>
          <p className="text-sm text-gray-500 mb-6 px-4">
            Be the first to list items and become a featured shop.
          </p>
          <Link
            href="/dashboard/items?action=list"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm"
          >
            <Store className="w-4 h-4" />
            Start Your Shop
          </Link>
        </div>
      ) : (
        <>
          {/* Popular shops */}
          <div className="mt-2">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Popular shops</h3>
            <div className="space-y-4">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {shop.image ? (
                        <img
                          src={shop.image}
                          alt={shop.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Store className="w-6 h-6 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{shop.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {shop.location || "South Africa"} · {shop.itemCount} item{shop.itemCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {shop.rating > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-gray-600">{shop.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    {/* View shop link */}
                    <Link
                      href={`/search?ownerId=${shop.id}`}
                      className="text-xs font-medium text-orange-500 hover:text-orange-600 shrink-0 px-3 py-1.5 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      View shop
                    </Link>
                  </div>

                  {shop.featuredItems.length > 0 && (
                    <div className="overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
                      <div className="flex gap-2">
                        {shop.featuredItems.map((item) => {
                          const imageUrl = normalizeImageUrl(item.imageUrl);
                          return (
                            <Link
                              key={item.id}
                              href={`/items/${item.id}`}
                              className="flex-shrink-0 w-28 snap-start group"
                            >
                              <div className="aspect-[4/5] rounded-lg bg-gray-100 overflow-hidden relative">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <ImageIcon className="w-6 h-6 text-gray-300" />
                                  </div>
                                )}
                                <div className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-gray-800 px-1.5 py-0.5 rounded-full z-10">
                                  R{item.price.toFixed(0)}/day
                                </div>
                              </div>
                              <p className="text-xs font-medium text-gray-900 mt-1.5 truncate">{item.title}</p>
                              <p className="text-[10px] text-gray-400">R{item.price?.toFixed(0)}/day</p>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Category badges — link to search with proper category filter */}
      <div className="mt-8">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Browse by category</h4>
        <div className="flex flex-wrap gap-2">
          {categoryEntries.map(([slug, label]) => (
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
  );
}