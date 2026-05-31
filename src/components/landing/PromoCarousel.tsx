"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Slide {
  image: string;
  alt: string;
  title: string;
  subtitle: string;
  category: string;
  /** Tailwind gradient from … to … */
  gradient: string;
  textSide: "left" | "right";
}

const slides: Slide[] = [
  {
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80&auto=format&fit=crop",
    alt: "Event & catering equipment",
    title: "Event & Catering Equipment",
    subtitle:
      "Tents, chairs, catering gear & party essentials — rent or sell for FREE",
    category: "event-catering",
    gradient: "from-rose-600/90 via-rose-700/80 to-transparent",
    textSide: "left",
  },
  {
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&auto=format&fit=crop",
    alt: "Home & garden tools",
    title: "Home & Garden Tools",
    subtitle:
      "Drills, mowers, ladders & landscaping gear — list your tools free",
    category: "home-garden",
    gradient: "from-emerald-600/90 via-emerald-700/80 to-transparent",
    textSide: "left",
  },
  {
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&auto=format&fit=crop",
    alt: "Headphones & audio gear",
    title: "Headphones & Audio",
    subtitle:
      "Wireless earbuds, studio cans & portable speakers — sell yours today",
    category: "audio",
    gradient: "from-violet-600/90 via-violet-700/80 to-transparent",
    textSide: "left",
  },
  {
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80&auto=format&fit=crop",
    alt: "Chargers & tech cables",
    title: "Chargers & Tech Cables",
    subtitle:
      "Cables, adapters, power banks & charging hubs — declutter & earn",
    category: "tech-accessories",
    gradient: "from-cyan-600/90 via-cyan-700/80 to-transparent",
    textSide: "left",
  },
  {
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80&auto=format&fit=crop",
    alt: "Books & textbooks",
    title: "Books & Textbooks",
    subtitle:
      "Sell your old textbooks, novels & study guides — zero fees",
    category: "books",
    gradient: "from-amber-600/90 via-amber-700/80 to-transparent",
    textSide: "left",
  },
  {
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80&auto=format&fit=crop",
    alt: "Baby & kids items",
    title: "Baby & Kids Items",
    subtitle:
      "Strollers, toys, car seats & clothes — outgrown? list it free",
    category: "baby-kids",
    gradient: "from-sky-500/90 via-sky-600/80 to-transparent",
    textSide: "left",
  },
  {
    image:
      "https://images.unsplash.com/photo-1592639915302-5e9cc8a2f2ad?w=800&q=80&auto=format&fit=crop",
    alt: "Clothing & fashion",
    title: "Clothing & Fashion",
    subtitle:
      "Pre-loved designer, streetwear & vintage — sell with zero fees",
    category: "fashion",
    gradient: "from-pink-500/90 via-pink-600/80 to-transparent",
    textSide: "left",
  },
  {
    image:
      "https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&q=80&auto=format&fit=crop",
    alt: "Sports & fitness gear",
    title: "Sports & Fitness Gear",
    subtitle:
      "Bikes, dumbbells, yoga mats & camping kit — earn from what you own",
    category: "sports",
    gradient: "from-teal-600/90 via-teal-700/80 to-transparent",
    textSide: "left",
  },
  {
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80&auto=format&fit=crop",
    alt: "Free unlimited listings promotion",
    title: "✨ Free Unlimited Listings",
    subtitle:
      "List as many items as you want — absolutely FREE! No fees, no limits.",
    category: "promo",
    gradient: "from-indigo-700/90 via-purple-800/80 to-transparent",
    textSide: "left",
  },
];

function slideLink(slide: Slide): string {
  if (slide.category === "promo") return "/auth/signup";
  return `/dashboard/items/new?category=${slide.category}`;
}

function slideLabel(slide: Slide): string {
  if (slide.category === "promo") return "Start Listing Free →";
  return "List Now — It's Free";
}

export default function PromoCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const slide = slides[current];

  return (
    <section
      className="relative overflow-hidden w-screen md:rounded-2xl md:mx-4 mt-4 shadow-xl min-h-72 sm:min-h-96 md:h-80 flex flex-col justify-center md:w-auto"
      style={{
        paddingTop: "1.5cm",
        paddingBottom: "1.5cm",
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background image */}
      <Image
        src={slide.image}
        alt={slide.alt}
        fill
        className="object-cover transition-all duration-700 -z-10"
        priority
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 800px"
      />

      {/* Gradient overlay - enhanced for readability */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} -z-5`}
      />

      {/* Extra dark scrim for readability */}
      <div className="absolute inset-0 bg-black/35 -z-5" />

      {/* Content */}
      <div
        className={`relative z-10 flex flex-col justify-center px-6 sm:px-8 md:px-10 py-6 h-full gap-3 sm:gap-4 ${
          slide.textSide === "right" ? "items-end text-right" : "items-start text-left"
        }`}
      >
        <span className="inline-block bg-white/25 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
          {slide.alt}
        </span>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] max-w-xl leading-tight">
          {slide.title}
        </h2>

        <p className="text-base sm:text-lg text-white max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)] leading-relaxed">
          {slide.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href={slideLink(slide)}
            className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition text-base sm:text-lg shadow-xl hover:shadow-2xl"
          >
            {slideLabel(slide)}
          </Link>
          {slide.category !== "promo" && (
            <Link
              href={`/search?category=${slide.category}`}
              className="inline-flex items-center justify-center gap-2 bg-white/20 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/30 active:bg-white/40 transition text-base sm:text-lg backdrop-blur-sm border-2 border-white/40 shadow-lg hover:shadow-xl"
            >
              Browse Items
            </Link>
          )}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/70 flex items-center justify-center transition z-20 shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/60 active:bg-black/70 flex items-center justify-center transition z-20 shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === current ? "bg-white w-6 h-2.5" : "bg-white/50 hover:bg-white/70 w-2.5 h-2.5"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
