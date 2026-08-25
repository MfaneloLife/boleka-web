import { prisma } from "./prisma";

export const SITE_URL = "https://eboleka.co.za";

const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL || "https://pub-0bf9994c37384a93b6f02dc5dc60ec44.r2.dev";

/**
 * Normalise an image URL stored in Neon.
 * Images are stored as full URLs, absolute paths, or bare filenames in
 * Cloudflare R2. Prefix relative values with the R2 public URL so the
 * homepage HTML always serves an absolute, crawlable image URL.
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string" || url.trim() === "") return null;
  const trimmed = url.trim();
  if (trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return `${R2_PUBLIC_URL}${trimmed}`;
  return `${R2_PUBLIC_URL}/${trimmed}`;
}

export interface PublicListing {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  price: number;
  rentalPrice: number | null;
  itemType: string | null;
  imageUrl: string | null;
  location: string;
}

interface LocationSource {
  city?: string | null;
  region?: string | null;
  suburb?: string | null;
}

/** Derive a human-readable location for a listing. */
export function getListingLocation(
  address?: string | null,
  user?: LocationSource | null
): string {
  if (address && address.trim()) return address.trim();

  const parts = [user?.suburb, user?.city, user?.region]
    .map((part) => (part ? part.trim() : ""))
    .filter(Boolean);

  return Array.from(new Set(parts)).join(", ") || "South Africa";
}

/**
 * Resolve the display price for a listing.
 * Mirrors `src/components/PriceDisplay.tsx` so the schema and visible HTML
 * always show the same number (rental daily rate vs sale price).
 */
export function getListingPrice(item: {
  itemType?: string | null;
  price?: number | null;
  rentalPrice?: number | null;
}): { value: number; isRental: boolean } {
  const type = item.itemType || null;
  const value = item.price ?? 0;

  let isRental = type !== "SELLING";
  if (type === "BOTH") {
    const rentalPrice = item.rentalPrice ?? null;
    if (rentalPrice === null || rentalPrice <= 0) isRental = false;
  }

  let displayValue = value;
  if (isRental) {
    const rentalPrice = item.rentalPrice ?? null;
    if (rentalPrice !== null && rentalPrice > 0) displayValue = rentalPrice;
  }

  return { value: displayValue, isRental };
}

/** Fetch all active, in-stock public listings from Neon. */
export async function getPublicListings(limit = 200): Promise<PublicListing[]> {
  const items = await prisma.item.findMany({
    where: { isActive: true, quantity: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { city: true, region: true, suburb: true } },
      images: { orderBy: { order: "asc" }, take: 1 },
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    condition: item.condition,
    price: item.price,
    rentalPrice: item.rentalPrice ?? null,
    itemType: item.itemType ?? null,
    imageUrl: normalizeImageUrl(item.images[0]?.url),
    location: getListingLocation(item.address, item.user),
  }));
}
