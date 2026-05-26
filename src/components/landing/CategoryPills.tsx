"use client";

import Link from "next/link";

const pills = [
  { label: "Women", href: "/search?q=women" },
  { label: "Men", href: "/search?q=men" },
  { label: "Kids", href: "/search?q=kids" },
  { label: "Beauty", href: "/search?q=beauty" },
  { label: "Home, School & work", href: "/search?q=home" },
  { label: "Sports & Leisure", href: "/search?q=sports" },
];

export default function CategoryPills() {
  return (
    <div className="px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto">
      <div className="flex gap-4 max-w-7xl mx-auto whitespace-nowrap">
        {pills.map((pill) => (
          <Link
            key={pill.label}
            href={pill.href}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition"
          >
            {pill.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
