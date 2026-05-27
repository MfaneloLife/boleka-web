"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Store, ShoppingBag, Star, ArrowRight, Heart } from "lucide-react";

export default function ShopsTab() {
  return (
    <div className="px-4 py-6 bg-white min-h-[60vh]">
      {/* Hero section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shops</h2>
        <p className="text-gray-500">Discover trusted vendors and their items</p>
      </div>

      <SignedOut>
        <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-2xl flex items-center justify-center">
            <Store className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Join the community</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Sign up to follow your favourite shops, save items, and get notified about new listings.
          </p>
          <SignInButton mode="modal">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300">
              Get Started
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-2xl flex items-center justify-center">
            <Heart className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Your favourite shops</h3>
          <p className="text-gray-500 mb-6">
            You haven't followed any shops yet.
          </p>
          <Link
            href="/dashboard/client/search"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300"
          >
            <ShoppingBag className="w-5 h-5" />
            Browse Items
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </SignedIn>

      {/* Featured vendors section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Popular shops</h3>
          <Link
            href="/dashboard/client/search"
            className="text-sm font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Empty state for featured shops */}
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
            <Store className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">
            Featured shops will appear here as vendors join the platform.
          </p>
        </div>

        {/* Category badges */}
        <div className="mt-8">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Browse by category</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Tools & Equipment", icon: "🔧" },
              { name: "Vehicles & Transport", icon: "🚗" },
              { name: "Electronics", icon: "📱" },
              { name: "Sports & Outdoor", icon: "⚽" },
              { name: "Fashion & Accessories", icon: "👗" },
              { name: "Home & Garden", icon: "🏡" },
              { name: "Party & Events", icon: "🎉" },
              { name: "Books & Media", icon: "📚" },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={`/dashboard/client/search?category=${encodeURIComponent(cat.name.toLowerCase())}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 text-gray-700 hover:text-orange-600 rounded-xl text-sm font-medium transition-all"
              >
                <span className="text-base">{cat.icon}</span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">How it works</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Find items</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Browse listings</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 bg-green-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Follow shops</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Save favourites</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2 bg-purple-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Rent or buy</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Easy checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
