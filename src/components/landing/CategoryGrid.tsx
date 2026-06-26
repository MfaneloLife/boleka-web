"use client";

import Link from "next/link";
import { Monitor, Wrench, UtensilsCrossed, Dumbbell, Tent, BookOpen, Sparkles, CarFront, Puzzle, Palette, Ellipsis } from "lucide-react";

const categories = [
  {
    label: "Electronics & Technology",
    slug: "electronics-tech",
    icon: Monitor,
    img: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=450&fit=crop",
  },
  {
    label: "Home & Garden Tools",
    slug: "home-garden",
    icon: Wrench,
    img: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=600&h=450&fit=crop",
  },
  {
    label: "Events & Catering",
    slug: "events-catering",
    icon: UtensilsCrossed,
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=450&fit=crop",
  },
  {
    label: "Sports & Fitness Kit",
    slug: "sports-leisure",
    icon: Dumbbell,
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=450&fit=crop",
  },
  {
    label: "Camping & Outdoor",
    slug: "camping-outdoor",
    icon: Tent,
    img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80&auto=format&fit=crop",
  },
  {
    label: "Books & Media",
    slug: "books-media",
    icon: BookOpen,
    img: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=450&fit=crop",
  },
  {
    label: "Fashion & Beauty",
    slug: "clothing-fashion",
    icon: Sparkles,
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=450&fit=crop",
  },
  {
    label: "Vehicles & Trailers",
    slug: "vehicles-transport",
    icon: CarFront,
    img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=450&fit=crop",
  },
  {
    label: "Toys & Games",
    slug: "toys-games",
    icon: Puzzle,
    img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=450&fit=crop",
  },
  {
    label: "Local Design & Art",
    slug: "local-design-crafts",
    icon: Palette,
    img: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=450&fit=crop",
  },
  {
    label: "Other",
    slug: "other",
    icon: Ellipsis,
    img: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=450&fit=crop",
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
              key={cat.slug}
              href={`/search?category=${cat.slug}`}
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