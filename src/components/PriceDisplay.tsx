/**
 * Simple pricing display for items.
 *
 * Rules:
 *   SELLING → "R250"       (sale price from `price`)
 *   RENTING → "R150/day"   (daily rate from `price` or `rentalPrice`)
 *   BOTH    → "R150/day"   (treated as rental — uses `rentalPrice` if set, else `price`)
 *   null    → "R150/day"   (legacy — defaults to rental)
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

  // For non-SELLING items, prefer rentalPrice if available, otherwise use price
  const dailyRate =
    type !== "SELLING" && rentalPrice != null && rentalPrice > 0
      ? rentalPrice
      : value;

  const isRental = type !== "SELLING";
  const displayValue = isRental ? dailyRate : value;

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