"use client";

import Link from "next/link";

export default function FloatingCTA() {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <Link
        href="/dashboard/items/new"
        className="inline-block bg-orange-400 hover:bg-orange-500 text-white font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-lg transition transform hover:scale-105"
      >
        Start selling for free
      </Link>
    </div>
  );
}
