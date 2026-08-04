"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle mobile virtual keyboard "Go" / "Search" key
    if (e.key === "Enter") {
      e.preventDefault();
      // Blur to dismiss mobile keyboard
      inputRef.current?.blur();
      doSearch();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 bg-white">
      <div className="relative max-w-7xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search items and shops"
          enterKeyHint="search"
          className="search-input w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 text-base"
        />
      </div>
    </form>
  );
}
