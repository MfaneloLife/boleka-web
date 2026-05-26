"use client";

import Image from "next/image";

export default function HeroBanner() {
  return (
    <section className="relative bg-stone-900 text-white overflow-hidden">
      <div className="relative h-72 sm:h-96">
        {/* Background image placeholder - replace src with your actual image */}
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-700" />
        <Image
          src="/hero-phone.jpg"
          alt="BOLEKA app on phone"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <div className="mb-4">
            <span className="inline-block bg-black px-2 py-1 text-2xl sm:text-4xl font-extrabold tracking-tighter">
              ZERO
            </span>
          </div>
          <div className="mb-4">
            <span className="inline-block bg-black px-2 py-1 text-2xl sm:text-4xl font-extrabold tracking-tighter">
              selling fees
            </span>
          </div>
          <div className="mb-6">
            <span className="inline-block bg-orange-400 text-white px-3 py-1 text-sm sm:text-base font-semibold">
              sell & buy on BOLEKA
            </span>
          </div>
          <div className="flex gap-6 sm:gap-10 text-center">
            <div>
              <p className="text-lg sm:text-2xl font-bold">1 573 854</p>
              <p className="text-xs sm:text-sm text-gray-300">Users</p>
            </div>
            <div className="border-l border-gray-500 pl-6 sm:pl-10">
              <p className="text-lg sm:text-2xl font-bold">3 929 889</p>
              <p className="text-xs sm:text-sm text-gray-300">Items sold</p>
            </div>
            <div className="border-l border-gray-500 pl-6 sm:pl-10">
              <p className="text-lg sm:text-2xl font-bold">4.8</p>
              <p className="text-xs sm:text-sm text-gray-300">hellopeter</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
