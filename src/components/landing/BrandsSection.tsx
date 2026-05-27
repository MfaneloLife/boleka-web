"use client";

import Link from "next/link";
import { Tag } from "lucide-react";

const categories = [
  { name: "Tools", slug: "tools" },
  { name: "Equipment", slug: "equipment" },
  { name: "Vehicles", slug: "vehicles" },
  { name: "Electronics", slug: "electronics" },
];

export default function CategoriesSection() {
  return (
    <section className="px-4 py-6 bg-white">
      <div className="flex items-center justify-between max-w-7xl mx-auto mb-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">categories</h2>
        </div>
        <Link href="/dashboard/client/search" className="text-sm text-orange-500 font-medium">
          See more
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-7xl mx-auto">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/dashboard/client/search?category=${category.slug}`}
            className="flex items-center justify-center rounded-full border border-gray-200 py-3 px-4 hover:border-orange-300 transition"
          >
            <span className="text-sm font-semibold text-gray-800">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}