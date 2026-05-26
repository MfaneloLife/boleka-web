"use client";

import { Heart } from "lucide-react";

type Tab = "discover" | "shops" | "favourites";

interface TabNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabNav({ activeTab, onTabChange }: TabNavProps) {
  const tabs: { key: Tab; label: string; icon?: React.ReactNode }[] = [
    { key: "discover", label: "Discover" },
    { key: "shops", label: "Shops", icon: <Heart className="w-4 h-4" /> },
    { key: "favourites", label: "Favourites", icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <nav className="sticky top-[57px] z-40 bg-white border-b border-gray-200">
      <div className="flex max-w-7xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
                isActive ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {tab.icon}
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-orange-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
