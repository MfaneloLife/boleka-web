/**
 * Unified Category Registry — Single Source of Truth.
 *
 * Every category reference in the application MUST trace back to this list.
 * Kept out of the API route file so it can be imported by both server code
 * and route handlers without violating Next.js route-handler export rules.
 */

export const UNIFIED_CATEGORIES = [
  { id: 'ELECTRONICS_TECH',     name: 'Electronics & Technology', slug: 'electronics-tech' },
  { id: 'HOME_GARDEN',          name: 'Home & Garden Tools',      slug: 'home-garden' },
  { id: 'EVENTS_CATERING',      name: 'Events & Catering',        slug: 'events-catering' },
  { id: 'SPORTS_LEISURE',       name: 'Sports & Fitness Kit',     slug: 'sports-leisure' },
  { id: 'CAMPING_OUTDOOR',      name: 'Camping & Outdoor',        slug: 'camping-outdoor' },
  { id: 'BOOKS_MEDIA',          name: 'Books & Media',            slug: 'books-media' },
  { id: 'CLOTHING_FASHION',     name: 'Fashion & Beauty',         slug: 'clothing-fashion' },
  { id: 'VEHICLES_TRANSPORT',   name: 'Vehicles & Trailers',      slug: 'vehicles-transport' },
  { id: 'TOYS_GAMES',           name: 'Toys & Games',             slug: 'toys-games' },
  { id: 'LOCAL_DESIGN_CRAFTS',  name: 'Local Design & Art',       slug: 'local-design-crafts' },
  { id: 'PETS',                 name: 'Pets',                     slug: 'pets' },
  { id: 'OTHER',                name: 'Other',                    slug: 'other' },
] as const;

export type CategoryId = (typeof UNIFIED_CATEGORIES)[number]['id'];

/**
 * Resolve a URL slug back to its DB category id.
 * Returns null for unrecognised slugs.
 */
export function resolveCategoryFromSlug(slug: string | null | undefined): CategoryId | null {
  if (!slug) return null;
  const match = UNIFIED_CATEGORIES.find((c) => c.slug === slug);
  return match ? (match.id as CategoryId) : null;
}

/**
 * Resolve a DB category id to its display name.
 * Falls back to "Other" for unrecognised values.
 */
export function categoryDisplayName(dbValue: string | null | undefined): string {
  if (!dbValue) return 'Other';
  const match = UNIFIED_CATEGORIES.find((c) => c.id === dbValue);
  return match?.name ?? 'Other';
}
