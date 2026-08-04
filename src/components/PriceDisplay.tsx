import { Tag } from "lucide-react";

/**
 * Smart pricing display for items based on the database listing type.
 *
 * DB fields (from Prisma schema):
 *   itemType:  SELLING | RENTING | BOTH | null
 *   price:     Selling price (for SELLING/BOTH) or daily rental rate (for RENTING)
 *   rentalPrice: Separate daily rental rate (only meaningful for BOTH)
 *
 * Display rules:
 *   null     → "R150"              (legacy — plain price, no suffix)
 *   SELLING  → "R250"              (sale price from `price`)
 *   RENTING  → "R150/day"          (daily rate from `rentalPrice` or `price`)
 *   BOTH     → "R150/day or Buy R250"  (only if both prices > 0 & differ)
 *              → "R150/day"        (only rentalPrice > 0)
 *              → "R250"            (only price > 0)
 */

interface PriceDisplayProps {
  itemType?: string | null;
  price?: number | null;
  rentalPrice?: number | null;
  compact?: boolean;
  variant?: "badge" | "inline";
}

export default function PriceDisplay({
  itemType,
  price,
  rentalPrice,
  compact = false,
  variant = "badge",
}: PriceDisplayProps) {
  const type = itemType || null;
  const hasSalePrice = price != null && price > 0;
  const hasRentalPrice = rentalPrice != null && rentalPrice > 0;
  const salePrice = price ?? 0;
  const rentPrice = rentalPrice ?? price ?? 0;

  // ── Helper: single-price badge ──
  const singleBadge = (value: number, suffix?: string) => (
    <span
      className={`inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full ${
        compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
      }`}
    >
      R{value.toFixed(0)}
      {suffix ? <span className="text-gray-400 font-normal">{suffix}</span> : null}
    </span>
  );

  const singleInline = (value: number, suffix?: string) => (
    <span className="text-xs text-gray-500">
      R{value.toFixed(2)}
      {suffix ? <span className="text-gray-400">{suffix}</span> : null}
    </span>
  );

  // ── NULL — legacy items, show plain price ──
  if (!type) {
    if (variant === "badge") return singleBadge(salePrice);
    return singleInline(salePrice);
  }

  // ── SELLING ──
  if (type === "SELLING") {
    if (variant === "badge") return singleBadge(salePrice);
    return singleInline(salePrice);
  }

  // ── RENTING ──
  if (type === "RENTING") {
    // Prefer rentalPrice if set, otherwise price IS the daily rate
    const dailyRate = hasRentalPrice ? rentPrice : salePrice;
    if (variant === "badge") return singleBadge(dailyRate, "/day");
    return singleInline(dailyRate, "/day");
  }

  // ── BOTH ──
  // Only show dual pricing when both prices exist AND are > 0 AND differ
  const showDual = hasSalePrice && hasRentalPrice && salePrice !== rentPrice;

  if (showDual) {
    if (variant === "badge") {
      if (compact) {
        return (
          <span className="inline-flex items-center gap-0.5 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full text-[10px] px-1.5 py-0.5">
            <span>R{rentPrice.toFixed(0)}/day</span>
            <span className="text-gray-300">·</span>
            <span className="text-green-700 font-semibold">R{salePrice.toFixed(0)}</span>
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full text-xs px-2 py-0.5">
          <span className="flex items-center gap-0.5">
            <Tag className="w-3 h-3 text-orange-500" />
            R{rentPrice.toFixed(0)}
            <span className="text-gray-400 font-normal">/day</span>
          </span>
          <span className="text-gray-300">or</span>
          <span className="font-semibold text-green-700">Buy R{salePrice.toFixed(0)}</span>
        </span>
      );
    }
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500">
          R{rentPrice.toFixed(2)}
          <span className="text-gray-400">/day</span>
        </span>
        <span className="text-gray-300">or</span>
        <span className="font-semibold text-green-700">Buy R{salePrice.toFixed(2)}</span>
      </div>
    );
  }

  // Fallback: one or both prices are 0 / missing / equal → show whichever is valid
  if (hasRentalPrice) {
    if (variant === "badge") return singleBadge(rentPrice, "/day");
    return singleInline(rentPrice, "/day");
  }
  if (hasSalePrice) {
    if (variant === "badge") return singleBadge(salePrice);
    return singleInline(salePrice);
  }
  // Neither > 0 (shouldn't happen — show 0)
  if (variant === "badge") return singleBadge(0);
  return singleInline(0);
}