"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    image:
      "/images/home-garden-tools.jpg",
    title: "Home & Garden Tools",
    subtitle: "Rent drills, mowers, ladders & more",
  },
  {
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80&auto=format&fit=crop",
    title: "Books & Textbooks",
    subtitle: "List an item for free and start earning",
  },
  {
    image:
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80&auto=format&fit=crop",
    title: "Event & Catering Equipment",
    subtitle: "Tables, chairs, chafing dishes & more",
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

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const slide = slides[current];

  return (
    <section
      className="relative w-full overflow-hidden rounded-xl"
      style={{ aspectRatio: "3/4", maxHeight: "480px" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Image */}
      <Image
        src={slide.image}
        alt={slide.title}
        fill
        className="object-cover transition-opacity duration-500"
        priority
        sizes="(max-width: 640px) 100vw, 600px"
      />

      {/* Text overlay — no gradient, just shadowed text at bottom */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center text-center px-4 pb-8">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] mb-1">
          {slide.title}
        </h2>
        <p className="text-sm sm:text-base text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          {slide.subtitle}
        </p>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`rounded-full transition-all duration-300 ${
              idx === current
                ? "bg-white w-6 h-2"
                : "bg-white/50 hover:bg-white/70 w-2 h-2"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}