"use client";

import Link from "next/link";

const categories = [
  { label: "bloggers & influencers", href: "/search?q=influencers", bg: "bg-stone-700" },
  { label: "beauty", href: "/search?q=beauty", bg: "bg-stone-600" },
  { label: "local designs", href: "/search?q=local", bg: "bg-orange-700" },
  { label: "home", href: "/search?q=home", bg: "bg-stone-500" },
  { label: "books & magazines", href: "/search?q=books", bg: "bg-stone-600" },
  { label: "technology", href: "/search?q=technology", bg: "bg-stone-700" },
];

export default function CategoryGrid() {
  return (
    <section className="px-4 py-4 bg-white">
      <div className="grid grid-cols-2 gap-3 max-w-7xl mx-auto">
        {categories.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className={`relative overflow-hidden rounded-lg ${cat.bg} aspect-[4/3] flex items-center justify-center group`}
          >
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition" />
            <span className="relative text-white font-semibold text-center px-2 text-sm sm:text-base">
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
