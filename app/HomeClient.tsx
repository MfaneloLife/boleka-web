"use client";

import { useState } from "react";
import type { ListingItem } from "@/lib/listings";
import AppShell from "@/src/components/layout/AppShell";
import SearchBar from "@/src/components/landing/SearchBar";
import TabNav from "@/src/components/landing/TabNav";
import CategoryGrid from "@/src/components/landing/CategoryGrid";
import HeroBanner from "@/src/components/landing/HeroBanner";
import PromoCarousel from "@/src/components/landing/PromoCarousel";
import WeeklyPicks from "@/src/components/landing/WeeklyPicks";
import BrandsSection from "@/src/components/landing/BrandsSection";
import ItemsGrid from "@/src/components/landing/ItemsGrid";
import ShopsTab from "@/src/components/landing/ShopsTab";
import FavouritesTab from "@/src/components/landing/FavouritesTab";
import FloatingCTA from "@/src/components/landing/FloatingCTA";

type Tab = "discover" | "shops" | "favourites";

interface HomeClientProps {
  initialItems?: ListingItem[];
}

export default function HomeClient({ initialItems = [] }: HomeClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("discover");

  const handleTabChange = (tab: string) => {
    if (tab === "discover" || tab === "shops" || tab === "favourites") {
      setActiveTab(tab);
    }
  };

  return (
    <AppShell onTabChange={handleTabChange}>
      <div className="flex flex-col pb-20 w-full max-w-full overflow-x-hidden">
      <SearchBar />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "discover" && (
        <>
          <PromoCarousel />
          <WeeklyPicks />
          <CategoryGrid />
          <BrandsSection />
          <ItemsGrid initialItems={initialItems} />
        </>
      )}

      {activeTab === "shops" && <ShopsTab />}
      {activeTab === "favourites" && <FavouritesTab />}

      <FloatingCTA />
      </div>
    </AppShell>
  );
}