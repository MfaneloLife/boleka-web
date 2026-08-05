/**
 * Simple pricing display for items based on itemType.
 *
 * DB fields:
 *   itemType:    SELLING | RENTING | BOTH | null
 *   price:       Sale price (SELLING/BOTH) or daily rate (RENTING)
 *   rentalPrice: Separate daily rate (only for BOTH items that truly rent)
 *
 * Display rules:
 *   SELLING                          → "R250"
 *   RENTING                          → "R150/day"
 *   BOTH + rentalPrice > 0           → "R150/day"
 *   BOTH + rentalPrice null/0        → "R250"      (no rental price = sell only)
 *   null                             → "R150/day"  (legacy, default to rental)
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
  const value = price ?? 0;

  // Determine if this item is actually rental:
  // - SELLING → never rental
  // - RENTING → always rental
  // - BOTH → only rental if rentalPrice exists and > 0
  // - null → default to rental (legacy)
  let isRental = type !== "SELLING";

  if (type === "BOTH") {
    // Only show rental pricing if a real rentalPrice is set and differs from sale price
    const rp = rentalPrice ?? null;
    if (rp === null || rp <= 0) {
      isRental = false;
    }
  }

  // For rental items, prefer rentalPrice, otherwise use price
  let displayValue = value;
  if (isRental) {
    const rp = rentalPrice ?? null;
    if (rp !== null && rp > 0) {
      displayValue = rp;
    }
  }

  if (variant === "badge") {
    return (
      <span
        className={`inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full ${
          compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"
        }`}
      >
        R{displayValue.toFixed(0)}
        {isRental ? <span className="text-gray-400 font-normal">/day</span> : null}
      </span>
    );
  }
  return (
    <span className="text-xs text-gray-500">
      R{displayValue.toFixed(2)}
      {isRental ? <span className="text-gray-400">/day</span> : null}
    </span>
  );
}