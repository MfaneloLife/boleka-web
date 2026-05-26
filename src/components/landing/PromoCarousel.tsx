"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Package, Shirt, Sofa, BookOpen, Smartphone, Bike, Camera, Watch, Mic, Dumbbell } from "lucide-react";
import Link from "next/link";

interface Slide {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  category: string;
  bg: string;
  iconBg: string;
}

const slides: Slide[] = [
  {
    icon: <Smartphone className="w-10 h-10 sm:w-14 sm:h-14" />,
    title: "Sell Your Electronics",
    subtitle: "Phones, laptops, tablets & more — list for FREE",
    category: "electronics",
    bg: "from-blue-600 to-blue-800",
    iconBg: "bg-blue-400/20",
  },
  {
    icon: <Shirt className="w-10 h-10 sm:w-14 sm:h-14" />,
    title: "Fashion & Clothing",
    subtitle: "Sell pre-loved fashion. Zero listing fees!",
    category: "fashion",
    bg: "from-pink-500 to-rose-600",
    iconBg: "bg-pink-300/20",
  },
  {
    icon: <Sofa className="w-10 h-10 sm:w-14 sm:h-14" />,
    title: "Home & Furniture",
    subtitle: "Turn unused furniture into cash — list free",
    category: "home",
    bg: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-300/20",
  },
  {
    icon: <BookOpen className="w-10 h-10 sm:w-14 sm:h-14" />,
    title: "Books & Textbooks",
    subtitle: "Sell your old textbooks & novels for FREE",
    category: "books",
    bg: "from-emerald-500 to-green-600",
    iconBg: "bg-emerald-300/20",
  },
  {
    icon: <Bike className="w-10 h-10 sm:w-14 sm:h-14" />,
    title: "Sports & Outdoors",
    subtitle: "Bikes, gym gear & camping equipment",
    category: "sports",
    bg: "from-teal-500 to-cyan-600",
    iconBg: "bg-teal-300/20",
  },
  {
    icon: <Package className="w-10 h-10 sm:w-14 sm:h-14" />,
    title: "✨ Free Unlimited Listings",
    subtitle: "List as many items as you want — absolutely FREE!",
    category: "promo",
    bg: "from-purple-600 to-indigo-700",
    iconBg: "bg-purple-300/20",
  },
];

export default function PromoCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const slide = slides[current];

  return (
    <section
      className="relative overflow-hidden rounded-2xl mx-4 mt-4 shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide background */}
      <div className={`relative bg-gradient-to-br ${slide.bg} text-white transition-all duration-500`}>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-6 sm:p-10 min-h-[200px] sm:min-h-[240px]">
          {/* Icon */}
          <div className={`${slide.iconBg} rounded-2xl p-4 sm:p-6 flex-shrink-0`}>
            {slide.icon}
          </div>

          {/* Text */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-3xl font-extrabold mb-2">{slide.title}</h2>
            <p className="text-sm sm:text-base text-white/80 max-w-md mb-5">{slide.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              <Link
                href={slide.category === "promo" ? "/auth/signup" : `/dashboard/items/new?category=${slide.category}`}
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-100 transition text-sm sm:text-base shadow-lg"
              >
                {slide.category === "promo" ? "Start Listing Free →" : `List ${slide.category === "electronics" ? "Electronics" : slide.category === "fashion" ? "Fashion" : slide.category === "home" ? "Home Items" : slide.category === "books" ? "Books" : "Items"}`}
              </Link>
              {slide.category !== "promo" && (
                <Link
                  href={`/search?category=${slide.category}`}
                  className="inline-flex items-center justify-center gap-2 bg-white/15 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-white/25 transition text-sm sm:text-base backdrop-blur-sm"
                >
                  Browse Items
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition z-20"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition z-20"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Dots indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              idx === current ? "bg-white w-5" : "bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
