"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function FavouritesTab() {
  return (
    <div className="px-4 py-6 bg-white min-h-[60vh]">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Your favourite items</h2>

      <SignedOut>
        <div className="text-center py-10">
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
        <p className="text-gray-500">Items you favourite will appear here.</p>
      </SignedIn>
    </div>
  );
}
