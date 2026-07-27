"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import { Heart, ImageIcon, Loader2, Trash2, Search } from "lucide-react";
import ShareButton from "@/src/components/ShareButton";

interface FavItem {
  id: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    price: number;
    category: string;
    imageUrl: string | null;
    owner: { id: string; name: string; image: string | null };
  };
}

export default function FavouritesTab() {
  const { isLoaded, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const router = useRouter();
  const [favourites, setFavourites] = useState<FavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchFavourites();
    else if (isLoaded && !isSignedIn) setLoading(false);
  }, [isLoaded, isSignedIn]);

  const fetchFavourites = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/favourites");
      if (res.ok) {
        const data = await res.json();
        setFavourites(data);
      }
    } catch (err) {
      console.error("favourites error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavourite = async (itemId: string) => {
    // Optimistic removal
    setFavourites((prev) => prev.filter((f) => f.item.id !== itemId));
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        // Revert on failure
        fetchFavourites();
      }
    } catch {
      fetchFavourites();
    }
  };

  return (
    <div className="px-4 py-6 bg-white min-h-[60vh]">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Your favourite items</h2>

      <SignedOut>
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No favourites yet</h3>
          <p className="text-sm text-gray-500 max-w-xs mb-6">
            Explore items and tap the heart icon to save things you love!
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => openSignIn()}
              className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition shadow-sm"
            >
              Sign up / Login
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              <Search className="w-4 h-4" />
              Explore Items
            </Link>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
            <p className="text-gray-400 text-sm">Loading favourites...</p>
          </div>
        ) : favourites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No favourites yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mb-6">
              Explore items and tap the heart icon to save things you love!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition shadow-sm"
            >
              <Search className="w-4 h-4" />
              Explore Items
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {favourites.map((fav) => (
              <div key={fav.id} className="relative group">
                <Link
                  href={`/items/${fav.item.id}`}
                  className="block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {fav.item.imageUrl ? (
                      <img src={fav.item.imageUrl} alt={fav.item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-gray-900 truncate">{fav.item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">R{fav.item.price?.toFixed(2)}/day</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate">{fav.item.owner.name}</p>
                  </div>
                </Link>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ShareButton itemId={fav.item.id} compact className="w-7 h-7 bg-white/90 shadow-sm" />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleUnfavourite(fav.item.id);
                    }}
                    className="w-7 h-7 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:bg-red-50"
                    title="Remove from favourites"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SignedIn>
    </div>
  );
}