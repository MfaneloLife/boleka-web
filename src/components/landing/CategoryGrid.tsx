"use client";

import Link from "next/link";
import { Home, Sparkles, Laptop, BookOpen, Palette } from "lucide-react";

const categories = [
  {
    label: "Home",
    href: "/search?q=home",
    icon: Home,
    img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=450&fit=crop",
  },
  {
    label: "Beauty",
    href: "/search?q=beauty",
    icon: Sparkles,
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=450&fit=crop",
  },
  {
    label: "Technology",
    href: "/search?q=technology",
    icon: Laptop,
    img: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=450&fit=crop",
  },
  {
    label: "Books & Magazine",
    href: "/search?q=books",
    icon: BookOpen,
    img: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=450&fit=crop",
  },
  {
    label: "Local Design",
    href: "/search?q=local+design",
    icon: Palette,
    img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=450&fit=crop",
  },
];

export default function CategoryGrid() {
  return (
    <section className="px-4 py-6 bg-white">
      <div className="max-w-7xl mx-auto mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Browse Categories</h2>
        <p className="text-sm text-gray-500 mt-0.5">Find what you need to rent</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-7xl mx-auto">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              href={cat.href}
              className="relative group overflow-hidden rounded-xl aspect-[4/3] block"
            >
              {/* Background image */}
              <img
                src={cat.img}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-white/90" />
                  <span className="text-white font-semibold text-sm">{cat.label}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
