import { Tag } from "lucide-react";

/**
 * Smart pricing display for items based on their listing type.
 *
 * Database schema (from prisma):
 *   itemType: SELLING | RENTING | BOTH | null
 *   price:    Sale price (for SELLING/BOTH) or daily rate (for RENTING)
 *   rentalPrice: Separate daily rental rate (only used when itemType is BOTH)
 *
 * Display rules:
 *   SELLING  → "R250"              (price = sale price)
 *   RENTING  → "R150/day"          (price = daily rate)
 *   BOTH     → "R150/day or Buy R250"  (rentalPrice = daily, price = sale)
 *   null     → "R150"              (neutral — no /day suffix, no Buy label)
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
  const salePrice = price ?? 0;

  // ── itemType is null (legacy items) — show plain price, no assumptions ──
  if (!type) {
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
    return <span className="text-xs text-gray-500">R{salePrice.toFixed(2)}</span>;
  }

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
    return <span className="text-xs text-gray-500">R{salePrice.toFixed(2)}</span>;
  }

  // ── RENTING only ──
  if (type === "RENTING") {
    // For RENTING items, `price` *is* the daily rate.
    // `rentalPrice` may also be set (redundantly) — prefer it if available,
    // otherwise use `price`.
    const dailyRate = rentalPrice ?? price ?? 0;

    if (variant === "badge") {
      return (
        <span
          className={`inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full ${
            compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
          }`}
        >
          R{dailyRate.toFixed(0)}
          <span className="text-gray-400 font-normal">/day</span>
        </span>
      );
    }
    return (
      <span className="text-xs text-gray-500">
        R{dailyRate.toFixed(2)}
        <span className="text-gray-400">/day</span>
      </span>
    );
  }

  // ── BOTH (rent + sell) ──
  // `price` = sale price, `rentalPrice` = daily rental rate.
  // If rentalPrice is missing, we cannot show both — fall back to sale price only.
  const rentPrice = rentalPrice ?? null;

  if (!rentPrice) {
    // rentalPrice not set → can't show dual pricing, show sale price only
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
    return <span className="text-xs text-gray-500">R{salePrice.toFixed(2)}</span>;
  }

  // Both prices available — show dual pricing
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