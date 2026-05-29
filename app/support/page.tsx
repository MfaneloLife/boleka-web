import type { Metadata } from "next";
import AppShellClient from "@/src/components/layout/AppShellClient";

export const metadata: Metadata = {
  title: "Help & Support - Boleka",
  description: "Get help with Boleka, the peer-to-peer sharing platform.",
};

const faqs = [
  {
    q: "How do I list an item?",
    a: "Go to your Dashboard → My Shop and click 'Add Item'. Fill in the details, upload photos, and set your daily price.",
  },
  {
    q: "How does renting work?",
    a: "Browse items, tap 'Request Item' to start a conversation with the owner. Once you agree on terms, you can arrange pickup and payment.",
  },
  {
    q: "What if an item is damaged?",
    a: "Report the issue immediately through the order page. Our resolution team will review the case and help mediate if needed.",
  },
  {
    q: "How do I get paid as an owner?",
    a: "Payments are processed through your wallet. Once a rental is completed, funds are available to withdraw to your bank account.",
  },
  {
    q: "How do returns work?",
    a: "The return window is set by the owner (usually 48 hours after agreed end date). Late returns incur a daily fee as set in the listing.",
  },
  {
    q: "How do I contact support?",
    a: "Email us at support@boleka.com or use the chat feature in your dashboard. We aim to respond within 24 hours.",
  },
];

export default function SupportPage() {
  return (
    <AppShellClient>
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
            <p className="text-gray-500 mt-2">Find answers to common questions</p>
          </div>

          {/* FAQ */}
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden group"
              >
                <summary className="px-5 py-4 text-sm font-semibold text-gray-900 cursor-pointer hover:text-orange-600 transition-colors list-none flex items-center justify-between">
                  {faq.q}
                  <svg
                    className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-white text-center">
            <h2 className="text-lg font-bold">Still need help?</h2>
            <p className="text-sm text-white/80 mt-1 mb-4">
              Reach out to our support team and we'll get back to you within 24 hours.
            </p>
            <a
              href="mailto:support@boleka.com"
              className="inline-flex items-center gap-1.5 bg-white text-orange-600 font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-orange-50 transition"
            >
              Email support@boleka.com
            </a>
          </div>
        </div>
      </div>
    </AppShellClient>
  );
}