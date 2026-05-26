"use client";

import { X } from "lucide-react";
import { useState } from "react";

export default function AppBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => setVisible(false)} className="p-1">
            <X className="w-5 h-5 text-gray-500" />
          </button>
          <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">BOLEKA</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">BOLEKA</p>
            <p className="text-xs text-gray-500">Sell, list, earn - for FREE</p>
            <div className="flex gap-0.5 mt-0.5">
              {[1, 2, 3, 4].map((s) => (
                <svg key={s} className="w-3 h-3 text-orange-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.285-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                </svg>
              ))}
              <svg className="w-3 h-3 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <defs>
                  <linearGradient id="half">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.285-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
              </svg>
            </div>
          </div>
        </div>
        <button className="bg-orange-400 hover:bg-orange-500 text-white text-xs font-semibold px-4 py-2 rounded-md transition">
          Get the app
        </button>
      </div>
    </div>
  );
}
