import type { Metadata } from "next";
import FaqSection from "@/src/components/landing/FaqSection";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | E-BOLEKA",
  description:
    "Answers to your questions about renting and buying university textbooks, event equipment, and DIY tools on E-BOLEKA.",
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <FaqSection />
    </main>
  );
}