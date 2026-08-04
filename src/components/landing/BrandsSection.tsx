"use client";

import { Shield, CheckCircle, ChevronRight } from "lucide-react";

// ── Real payment brand SVGs ──

function VisaLogo() {
  return (
    <svg viewBox="0 0 48 16" fill="none" className="h-5 w-auto" aria-label="Visa">
      <rect width="48" height="16" rx="2" fill="#1A1F71" />
      <text x="24" y="12" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif">VISA</text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 48 16" fill="none" className="h-5 w-auto" aria-label="Mastercard">
      <rect width="48" height="16" rx="2" fill="#000" />
      <circle cx="18" cy="8" r="6" fill="#EB001B" opacity="0.9" />
      <circle cx="30" cy="8" r="6" fill="#F79E1B" opacity="0.85" />
      <circle cx="24" cy="8" r="6" fill="#FF5F00" opacity="0.6" />
      <text x="24" y="12.5" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700" fontFamily="Arial, sans-serif" style={{ letterSpacing: 0.5 }}>Mastercard</text>
    </svg>
  );
}

function PayFastLogo() {
  return (
    <svg viewBox="0 0 64 16" fill="none" className="h-5 w-auto" aria-label="PayFast">
      <rect width="64" height="16" rx="2" fill="#ED6C0D" />
      <text x="32" y="12" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700" fontFamily="Arial, sans-serif" letterSpacing="1">PayFast</text>
    </svg>
  );
}

const paymentPartners = [
  { name: "Visa", Logo: VisaLogo },
  { name: "Mastercard", Logo: MastercardLogo },
  { name: "PayFast", Logo: PayFastLogo },
];

export default function BrandsSection() {
  return (
    <section className="px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Main trust card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header / Trust Badge */}
          <div className="px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900">Safe renting & listing</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Every transaction is protected. Rent and list with peace of mind.
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Secure Payments Zone */}
          <div className="bg-gray-50 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Secure payments by
            </p>

            {/* Digital Payment Logos */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {paymentPartners.map((partner) => (
                <div
                  key={partner.name}
                  className="bg-white px-3 py-3 rounded-xl shadow-sm border border-gray-100 h-14 flex items-center justify-center transition-all hover:shadow-md hover:border-gray-200"
                >
                  <partner.Logo />
                </div>
              ))}
            </div>

            {/* Divider with text */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">and</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Smart Cash on Delivery */}
            <div className="bg-white rounded-xl border border-green-200 p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg md:text-xl font-bold text-gray-900">Smart Cash on Delivery</p>
                <p className="text-xs text-gray-500 mt-0.5">Pay only when you see the item in person.</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Trust footer / CTA */}
          <div className="px-5 py-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
            >
              Learn more about our protections
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}