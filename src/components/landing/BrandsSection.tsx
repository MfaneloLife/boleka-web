"use client";

import { Shield, ChevronRight } from "lucide-react";

function VisaLogo() {
  return (
    <svg viewBox="0 0 48 16" fill="none" className="h-5 w-auto" aria-label="Visa">
      <rect width="48" height="16" rx="2" fill="#1A1F71" />
      <text x="24" y="11.5" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif">VISA</text>
    </svg>
  );
}

function EFTLogo() {
  return (
    <svg viewBox="0 0 48 16" fill="none" className="h-5 w-auto" aria-label="EFT">
      <rect width="48" height="16" rx="2" fill="#1e293b" />
      <text x="24" y="11.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif">EFT</text>
    </svg>
  );
}

function PayFastLogo() {
  return (
    <svg viewBox="0 0 64 16" fill="none" className="h-5 w-auto" aria-label="PayFast">
      <rect width="64" height="16" rx="2" fill="#ED6C0D" />
      <text x="32" y="11.5" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="Arial, sans-serif">PayFast</text>
    </svg>
  );
}

function CODLogo() {
  return (
    <svg viewBox="0 0 64 16" fill="none" className="h-5 w-auto" aria-label="Cash on Delivery">
      <rect width="64" height="16" rx="2" fill="#16a34a" />
      <text x="32" y="11.5" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="700" fontFamily="Arial, sans-serif">CASH ON DELIVERY</text>
    </svg>
  );
}

const paymentPartners = [
  { name: "Visa", Logo: VisaLogo },
  { name: "EFT", Logo: EFTLogo },
  { name: "PayFast", Logo: PayFastLogo },
  { name: "Cash on Delivery", Logo: CODLogo },
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

          {/* Secure Payments Section */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Secure payments by
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {paymentPartners.map((partner) => (
                <div
                  key={partner.name}
                  className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center"
                >
                  <partner.Logo />
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Trust footer / link */}
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