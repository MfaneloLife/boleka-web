"use client";

import { Clock, Shield, BadgePercent, Banknote } from "lucide-react";

const perks = [
  { name: "Same Day Rental", desc: "Book and collect today", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  { name: "Secure Payments", desc: "Protected transactions", icon: Shield, color: "text-green-600", bg: "bg-green-50" },
  { name: "No Hidden Fees", desc: "Transparent pricing", icon: BadgePercent, color: "text-purple-600", bg: "bg-purple-50" },
  { name: "Best Rates", desc: "Competitive daily prices", icon: Banknote, color: "text-amber-600", bg: "bg-amber-50" },
];

export default function BrandsSection() {
  return (
    <section className="px-4 py-6 bg-white">
      <div className="max-w-7xl mx-auto mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Why Boleka?</h2>
        <p className="text-sm text-gray-500 mt-0.5">Rent with confidence</p>
      </div>
      <div className="grid grid-cols-2 gap-3 max-w-7xl mx-auto">
        {perks.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 hover:border-orange-200 hover:bg-orange-50/50 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
