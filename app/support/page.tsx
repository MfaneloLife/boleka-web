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
    a: "Browse items, tap 'Request Item' to start a conversation with the owner. The owner must accept your request before you can arrange pickup and payment.",
  },
  {
    q: "What if an item is damaged?",
    a: "Report the issue immediately through WhatsApp. Our resolution team will review the case and help mediate if needed.",
  },
  {
    q: "How do I get paid as an owner?",
    a: "Payments are processed through your wallet. Once a rental is completed, funds are available to withdraw to your bank account via EFT.",
  },
  {
    q: "How do returns work?",
    a: "The buyer returns the item by scanning the owner's QR code. This marks the item as available again on the platform.",
  },
  {
    q: "How do I contact support?",
    a: "Contact us on WhatsApp at 065 896 7514. We aim to respond within a few hours during business hours.",
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
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white text-center">
            <h2 className="text-lg font-bold">Still need help?</h2>
            <p className="text-sm text-white/80 mt-1 mb-4">
              Chat with us on WhatsApp and we'll get back to you quickly.
            </p>
            <a
              href="https://wa.me/27658967514"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-green-600 font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-green-50 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </AppShellClient>
  );
}