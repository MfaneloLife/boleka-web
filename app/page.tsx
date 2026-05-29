"use client";

import { useState } from "react";
import AppShell from "@/src/components/layout/AppShell";
import SearchBar from "@/src/components/landing/SearchBar";
import TabNav from "@/src/components/landing/TabNav";
import CategoryGrid from "@/src/components/landing/CategoryGrid";
import HeroBanner from "@/src/components/landing/HeroBanner";
import PromoCarousel from "@/src/components/landing/PromoCarousel";
import BrandsSection from "@/src/components/landing/BrandsSection";
import ShopsTab from "@/src/components/landing/ShopsTab";
import FavouritesTab from "@/src/components/landing/FavouritesTab";
import FloatingCTA from "@/src/components/landing/FloatingCTA";
import AppBanner from "@/src/components/landing/AppBanner";

type Tab = "discover" | "shops" | "favourites";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("discover");

  const handleTabChange = (tab: string) => {
    if (tab === "discover" || tab === "shops" || tab === "favourites") {
      setActiveTab(tab);
    }
  };

  return (
    <AppShell onTabChange={handleTabChange}>
      <div className="flex flex-col pb-20">
      <SearchBar />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "discover" && (
        <>
          <PromoCarousel />
          <CategoryGrid />
          <BrandsSection />
        </>
      )}

      {activeTab === "shops" && <ShopsTab />}
      {activeTab === "favourites" && <FavouritesTab />}

      <FloatingCTA />
      <AppBanner />
      </div>
    </AppShell>
  );
}
