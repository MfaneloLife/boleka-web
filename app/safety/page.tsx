import type { Metadata } from "next";
import AppShellClient from "@/src/components/layout/AppShellClient";

export const metadata: Metadata = {
  title: "Safety Tips - Boleka",
  description: "Stay safe when renting and sharing items on Boleka.",
};

const tips = [
  {
    title: "Meet in safe, public places",
    description:
      "When picking up or dropping off items, choose well-lit public locations like shopping centres, coffee shops, or police station parking lots.",
    icon: "📍",
  },
  {
    title: "Verify the item before paying",
    description:
      "Inspect the item thoroughly before making payment. Test electronics, check for damage, and ensure it matches the listing description.",
    icon: "🔍",
  },
  {
    title: "Use in-app messaging",
    description:
      "Keep all communication on the Boleka platform. This creates a record and helps our support team assist if issues arise.",
    icon: "💬",
  },
  {
    title: "Check user reviews",
    description:
      "Before renting from someone, check their profile reviews and reliability score. Trusted users have higher ratings and completed rentals.",
    icon: "⭐",
  },
  {
    title: "Read the rental agreement",
    description:
      "Review the terms, return window, and late fees before committing to a rental. The rental agreement outlines both parties' responsibilities.",
    icon: "📋",
  },
  {
    title: "Take photos",
    description:
      "Document the item's condition with photos at pickup and return. This protects both parties in case of disputes.",
    icon: "📸",
  },
  {
    title: "Don't share personal information",
    description:
      "Keep your phone number, address, and payment details within the app. Never share sensitive information through external channels.",
    icon: "🔒",
  },
  {
    title: "Report suspicious behaviour",
    description:
      "If something feels wrong, trust your instincts. Report any suspicious users or listings to our support team immediately.",
    icon: "🚨",
  },
];

export default function SafetyPage() {
  return (
    <AppShellClient>
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Safety Tips</h1>
            <p className="text-gray-500 mt-2">
              Stay safe when renting and sharing on Boleka
            </p>
          </div>

          {/* Tips grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tips.map((tip, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{tip.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {tip.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Emergency contact */}
          <div className="bg-red-50 rounded-2xl border border-red-100 p-6 text-center">
            <h2 className="text-lg font-bold text-red-800 mb-1">
              Need immediate help?
            </h2>
            <p className="text-sm text-red-600 mb-4">
              If you feel unsafe or need urgent assistance, contact local
              authorities first, then reach out to us.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:support@boleka.com"
                className="inline-flex items-center gap-1.5 bg-red-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-red-600 transition"
              >
                Report to Boleka
              </a>
              <a
                href="tel:10111"
                className="inline-flex items-center gap-1.5 bg-white text-red-600 font-semibold text-sm px-5 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 transition"
              >
                SAPS: 10111
              </a>
            </div>
          </div>
        </div>
      </div>
    </AppShellClient>
  );
}