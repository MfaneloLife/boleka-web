"use client";

import Link from "next/link";
import { Tag } from "lucide-react";

const brands = [
  { name: "Nike", slug: "nike" },
  { name: "ZARA", slug: "zara" },
  { name: "Forever New", slug: "forever-new" },
  { name: "Converse", slug: "converse" },
];

export default function BrandsSection() {
  return (
    <section className="px-4 py-6 bg-white">
      <div className="flex items-center justify-between max-w-7xl mx-auto mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">brands</h2>
        </div>
        <Link href="/search" className="text-sm text-orange-500 font-medium">
          See more
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-7xl mx-auto">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/search?brand=${brand.slug}`}
            className="flex items-center justify-center rounded-full border border-gray-200 py-3 px-4 hover:border-orange-300 transition"
          >
            <span className="text-sm font-semibold text-gray-800">{brand.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
