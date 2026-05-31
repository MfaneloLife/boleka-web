"use client";

import Image from "next/image";

export default function PromoCarousel() {
  return (
    <section className="relative w-full overflow-hidden h-52 sm:h-72">
      {/* Home & Garden tools image */}
      <Image
        src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80&auto=format&fit=crop"
        alt="Home & garden tools"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/60 to-emerald-800/40" />

      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] mb-2">
          Home & Garden Tools
        </h2>
        <p className="text-base sm:text-lg text-white/95 drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]">
          List an item for free and start earning
        </p>
      </div>
    </section>
  );
}