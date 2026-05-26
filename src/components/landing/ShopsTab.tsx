"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

const favouriteShops = [
  {
    name: "Daniela Canny",
    handle: "@danielacanny",
    avatar: "/avatar1.jpg",
    items: [
      { image: "/item1.jpg", price: 500 },
      { image: "/item2.jpg", price: 350 },
      { image: "/item3.jpg", price: 39 },
    ],
  },
];

export default function ShopsTab() {
  return (
    <div className="px-4 py-6 bg-white min-h-[60vh]">
      <SignedOut>
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Your favourite shops</h2>
          <div className="flex justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">Please log in to see your favourites.</p>
          <SignInButton mode="modal">
            <button className="bg-orange-400 hover:bg-orange-500 text-white font-medium px-6 py-2.5 rounded-md transition">
              Sign up / Login
            </button>
          </SignInButton>
        </div>
      </SignedOut>

      <SignedIn>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your favourite shops</h2>
        <p className="text-gray-500">Shops you follow will appear here.</p>
      </SignedIn>

      <div className="mt-10">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">BOLEKA users' favourite shops</h3>
        {favouriteShops.map((shop) => (
          <div key={shop.handle} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative">
                <Image src={shop.avatar} alt={shop.name} fill className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{shop.name}</p>
                <p className="text-xs text-orange-500">{shop.handle}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {shop.items.map((item, idx) => (
                <Link key={idx} href="/search" className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                  <Image src={item.image} alt="Item" fill className="object-cover" />
                  <button className="absolute top-1.5 right-1.5 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-gray-700" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-white/90 px-2 py-1">
                    <p className="text-xs font-semibold">R {item.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
