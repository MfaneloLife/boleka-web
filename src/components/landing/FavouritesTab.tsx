"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { Heart, ImageIcon, Loader2, Trash2 } from "lucide-react";

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
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        setFavourites((prev) => prev.filter((f) => f.item.id !== itemId));
      }
    } catch (err) {
      console.error("unfavourite error:", err);
    }
  };

  return (
    <div className="px-4 py-6 bg-white min-h-[60vh]">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Your favourite items</h2>

      <SignedOut>
        <div className="text-center py-10">
          <div className="flex justify-center mb-4">
            <Heart className="w-12 h-12 text-gray-300" />
          </div>
          <p className="text-gray-600 mb-6">Please log in to see your favourites.</p>
          <SignInButton mode="modal">
            <button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold px-6 py-2.5 rounded-xl transition shadow-md">
              Sign up / Login
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
            <p className="text-gray-400 text-sm">Loading favourites...</p>
          </div>
        ) : favourites.length === 0 ? (
          <div className="text-center py-10">
            <Heart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Items you favourite will appear here.</p>
            <p className="text-gray-400 text-sm mt-1">Tap the heart icon on any item to save it.</p>
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
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleUnfavourite(fav.item.id);
                  }}
                  className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  title="Remove from favourites"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SignedIn>
    </div>
  );
}