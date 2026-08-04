import { Tag } from "lucide-react";

/**
 * Smart pricing display for items based on their listing type.
 *
 * - SELLING: "R250" (sale price only)
 * - RENTING: "R150/day" (rental price only)
 * - BOTH:    Shows both selling price and rental price in adjacent badges
 *
 * Accepts either a full item object or individual props for flexibility.
 */

interface PriceDisplayProps {
  /** The listing type: SELLING, RENTING, or BOTH */
  itemType?: string | null;
  /** Sale/forever price (used for SELLING and BOTH) */
  price?: number | null;
  /** Rental daily price (used for RENTING and BOTH) */
  rentalPrice?: number | null;
  /** Compact mode for smaller cards (ShopsTab carousels) */
  compact?: boolean;
  /** Visual variant: 'badge' = floating overlay badge, 'inline' = text row */
  variant?: "badge" | "inline";
}

export default function PriceDisplay({
  itemType,
  price,
  rentalPrice,
  compact = false,
  variant = "badge",
}: PriceDisplayProps) {
  const type = itemType || "RENTING";
  const salePrice = price ?? 0;
  const rentPrice = rentalPrice ?? price ?? 0;

  // ── SELLING only ──
  if (type === "SELLING") {
    if (variant === "badge") {
      return (
        <span
          className={`inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full ${
            compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
          }`}
        >
          R{salePrice.toFixed(0)}
        </span>
      );
    }
    return (
      <span className="text-xs text-gray-500">
        R{salePrice.toFixed(2)}
      </span>
    );
  }

  // ── RENTING only ──
  if (type === "RENTING") {
    if (variant === "badge") {
      return (
        <span
          className={`inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full ${
            compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
          }`}
        >
          R{rentPrice.toFixed(0)}
          <span className="text-gray-400 font-normal">/day</span>
        </span>
      );
    }
    return (
      <span className="text-xs text-gray-500">
        R{rentPrice.toFixed(2)}
        <span className="text-gray-400">/day</span>
      </span>
    );
  }

  // ── BOTH ──
  if (variant === "badge") {
    if (compact) {
      return (
        <span
          className="inline-flex items-center gap-0.5 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full text-[10px] px-1.5 py-0.5"
        >
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
  // inline variant for BOTH
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