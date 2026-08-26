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

export interface ListingItem {
  id: string;
  title: string;
  description: string | null;
  price: number;
  rentalPrice: number | null;
  itemType: string | null;
  category: string;
  condition: string;
  quantity: number;
  imageUrl: string | null;
  imageUrls: string[];
  location: string | null;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
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

/**
 * Fetch all active, in-stock public listings from Neon.
 * Returns the shape consumed by the client-side `ItemsGrid` so the data can be
 * passed straight through as initial props for a single, SSR-friendly list.
 */
export async function getPublicListings(limit = 200): Promise<ListingItem[]> {
  const items = await prisma.item.findMany({
    where: { isActive: true, quantity: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          city: true,
          region: true,
          suburb: true,
        },
      },
      images: { orderBy: { order: "asc" } },
    },
  });

  return items.map((item) => {
    const imageUrls = item.images
      .map((image) => normalizeImageUrl(image.url))
      .filter((url): url is string => url !== null);

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      rentalPrice: item.rentalPrice ?? null,
      itemType: item.itemType ?? null,
      category: item.category,
      condition: item.condition,
      quantity: item.quantity,
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
      location: getListingLocation(item.address, item.user),
      user: {
        id: item.user.id,
        name: item.user.name ?? "Unknown",
        image: item.user.image ?? null,
      },
      createdAt: item.createdAt.toISOString(),
    };
  });
}
