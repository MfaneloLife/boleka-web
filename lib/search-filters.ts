/**
 * --------------------------------------------------------------------------
 * Boleka — Search & Category Filtering Algorithm
 * --------------------------------------------------------------------------
 * A pure, modular filtering engine for the peer-to-peer rental marketplace.
 *
 * Features:
 *   - Case-insensitive substring matching across title, description, and tags
 *   - Three distinct modes: category-only, search-only, combined
 *   - Excludes unavailable items (available: false)
 *   - Graceful empty-input handling (returns all active listings)
 *   - Designed for large catalogs — O(n) worst case, easily shardable
 * --------------------------------------------------------------------------
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Listing {
  id: string | number;
  title: string;
  description: string;
  category: string;
  /** Normalised to lowercase for matching; stored in original case for display */
  tags: string[];
  available: boolean;
  /** Price in Rands (informational — not used for filtering in this module) */
  price?: number;
}

export interface FilterParams {
  /** Exact category slug (e.g. "technology") or null */
  selectedCategory: string | null;
  /** Free-text search query or null */
  searchQuery: string | null;
}

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

/** Normalise a string for comparison: lowercase + trim */
const norm = (s: string): string => s.toLowerCase().trim();

/**
 * Returns true when `candidate` contains `term` as a substring
 * (case-insensitive).
 */
const containsTerm = (candidate: string, term: string): boolean =>
  norm(candidate).includes(norm(term));

// ---------------------------------------------------------------------------
// Core Algorithm
// ---------------------------------------------------------------------------

/**
 * getFilteredRentals
 *
 * Returns listings that match the given category and/or search query.
 *
 * @param listings  - Full catalogue of available + unavailable items.
 * @param params    - { selectedCategory, searchQuery }
 * @returns         - Filtered array (may be empty).
 *
 * Scenarios:
 *   A) Category Only    → items in that category, available === true
 *   B) Search Only      → global search across title, description, tags
 *   C) Combined         → narrow search to the selected category
 *   D) Both null/empty  → all available items (or featured — delegate upstream)
 */
export function getFilteredRentals(
  listings: Listing[],
  params: FilterParams
): Listing[] {
  const { selectedCategory, searchQuery } = params;

  const hasCategory =
    selectedCategory !== null && norm(selectedCategory).length > 0;
  const hasQuery =
    searchQuery !== null && norm(searchQuery).length > 0;

  // ------------------------------------------------------------------
  // Scenario D — no filters applied  →  all available
  // ------------------------------------------------------------------
  if (!hasCategory && !hasQuery) {
    return listings.filter((l) => l.available);
  }

  // ------------------------------------------------------------------
  // Scenario A — category only
  // ------------------------------------------------------------------
  if (hasCategory && !hasQuery) {
    const cat = norm(selectedCategory!);
    return listings.filter(
      (l) => l.available && norm(l.category) === cat
    );
  }

  // ------------------------------------------------------------------
  // Scenario B — search only (global)
  // ------------------------------------------------------------------
  if (!hasCategory && hasQuery) {
    const term = norm(searchQuery!);
    return listings.filter(
      (l) =>
        l.available &&
        (containsTerm(l.title, term) ||
          containsTerm(l.description, term) ||
          l.tags.some((tag) => containsTerm(tag, term)))
    );
  }

  // ------------------------------------------------------------------
  // Scenario C — combined (category + search)
  // ------------------------------------------------------------------
  const cat = norm(selectedCategory!);
  const term = norm(searchQuery!);
  return listings.filter(
    (l) =>
      l.available &&
      norm(l.category) === cat &&
      (containsTerm(l.title, term) ||
        containsTerm(l.description, term) ||
        l.tags.some((tag) => containsTerm(tag, term)))
  );
}

// ---------------------------------------------------------------------------
// Convenience: slug → display name mapper (mirrors CategoryGrid + SearchPage)
// ---------------------------------------------------------------------------

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'electronics-tech': 'Electronics & Technology',
  'home-garden': 'Home & Garden Tools',
  'events-catering': 'Events & Catering',
  'sports-leisure': 'Sports & Fitness Kit',
  'camping-outdoor': 'Camping & Outdoor',
  'books-media': 'Books & Media',
  'clothing-fashion': 'Fashion & Beauty',
  'vehicles-transport': 'Vehicles & Trailers',
  'toys-games': 'Toys & Games',
  'local-design-crafts': 'Local Design & Art',
  other: 'Other',
};

export const slugToLabel = (slug: string): string =>
  CATEGORY_SLUG_MAP[norm(slug)] ?? slug;

/** Convert a display label back to its slug (reverse lookup). */
export const labelToSlug = (label: string): string => {
  const n = norm(label);
  const entry = Object.entries(CATEGORY_SLUG_MAP).find(
    ([slug, display]) => norm(display) === n
  );
  return entry ? entry[0] : label.toLowerCase().replace(/\s+/g, "-");
};

// ---------------------------------------------------------------------------
// Mock dataset & self-contained tests (run with `npx tsx lib/search-filters.ts`)
// ---------------------------------------------------------------------------

/* c8 ignore start */
if (require.main === module) {
  const mockListings: Listing[] = [
    {
      id: 1,
      title: 'Canon EOS 70D Camera',
      description: 'Professional DSLR camera, perfect for photography enthusiasts.',
      category: 'Technology',
      tags: ['camera', 'dslr', 'photography', 'canon'],
      available: true,
      price: 450,
    },
    {
      id: 2,
      title: 'Yellow Armchair',
      description: 'Comfortable velvet armchair in mustard yellow. Great condition.',
      category: 'Home',
      tags: ['chair', 'armchair', 'velvet', 'yellow', 'furniture'],
      available: true,
      price: 120,
    },
    {
      id: 3,
      title: 'Weber Braai Stand',
      description: 'Portable charcoal braai. Perfect for weekend gatherings.',
      category: 'Home & Garden Tools',
      tags: ['braai', 'bbq', 'outdoor', 'cooking', 'weber'],
      available: true,
      price: 80,
    },
    {
      id: 4,
      title: 'MacBook Pro 16" M2',
      description: 'Latest MacBook Pro for creative professionals.',
      category: 'Technology',
      tags: ['laptop', 'apple', 'macbook', 'computer'],
      available: false, // already rented out
      price: 800,
    },
    {
      id: 5,
      title: 'Samsung 4K Smart TV',
      description: '55-inch UHD smart television with built-in streaming apps.',
      category: 'Technology',
      tags: ['tv', 'samsung', '4k', 'smart tv', 'entertainment'],
      available: true,
      price: 350,
    },
    {
      id: 6,
      title: 'Vintage Wooden Bookshelf',
      description: 'Solid oak bookshelf, 5 tiers. Holds up to 200 books.',
      category: 'Home',
      tags: ['bookshelf', 'shelf', 'wood', 'oak', 'vintage', 'furniture'],
      available: true,
      price: 200,
    },
    {
      id: 7,
      title: 'Nikon DSLR Lens 50mm',
      description: 'Prime lens for portrait photography.',
      category: 'Technology',
      tags: ['camera', 'lens', 'nikon', 'dslr', 'photography', '50mm'],
      available: true,
      price: 150,
    },
    {
      id: 8,
      title: 'Camping Tent 4-Person',
      description: 'Waterproof dome tent. Easy setup, includes carry bag.',
      category: 'Sport Kit',
      tags: ['camping', 'tent', 'outdoor', 'hiking', '4-person'],
      available: true,
      price: 200,
    },
    {
      id: 9,
      title: 'Professional Makeup Kit',
      description: 'Full makeup artist kit with 48 eyeshadows, foundations, and brushes.',
      category: 'Beauty',
      tags: ['makeup', 'cosmetics', 'beauty', 'professional', 'brushes'],
      available: true,
      price: 300,
    },
    {
      id: 10,
      title: 'Garden Lawn Mower',
      description: 'Electric lawn mower, 1500W. Lightweight and easy to manoeuvre.',
      category: 'Home & Garden Tools',
      tags: ['lawn', 'mower', 'garden', 'electric', 'tools'],
      available: true,
      price: 180,
    },
    {
      id: 11,
      title: 'DJI Mavic Air 2 Drone',
      description: '4K camera drone with 34-min flight time. Ideal for aerial photography.',
      category: 'Technology',
      tags: ['drone', 'dji', 'camera', 'aerial', '4k'],
      available: true,
      price: 600,
    },
    {
      id: 12,
      title: 'Handmade Ceramic Vase Set',
      description: 'Locally designed ceramic vases. Each piece is unique.',
      category: 'Local Design',
      tags: ['ceramic', 'vase', 'handmade', 'local', 'decor', 'design'],
      available: true,
      price: 90,
    },
  ];

  let passed = 0;
  let failed = 0;

  const assert = (description: string, actual: unknown[], expectedIds: (string | number)[]) => {
    const actualIds = (actual as Listing[]).map((l) => l.id).sort();
    const expectedSorted = [...expectedIds].sort();
    const ok =
      actualIds.length === expectedSorted.length &&
      actualIds.every((id, i) => id === expectedSorted[i]);

    console.log(`${ok ? '✓' : '✗'} ${description}`);
    if (!ok) {
      console.log(`  expected IDs: [${expectedSorted}]`);
      console.log(`  actual IDs:   [${actualIds}]`);
      failed++;
    } else {
      passed++;
    }
  };

  // --- Scenario D: both null → all available ---
  assert(
    'Both null → all available (excludes unavailable MacBook id=4)',
    getFilteredRentals(mockListings, { selectedCategory: null, searchQuery: null }),
    [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12]
  );

  // --- Scenario A: category only ---
  assert(
    'Category "Technology" only',
    getFilteredRentals(mockListings, { selectedCategory: 'Technology', searchQuery: null }),
    [1, 5, 7, 11] // id=4 MacBook is unavailable
  );

  assert(
    'Category "Home" only',
    getFilteredRentals(mockListings, { selectedCategory: 'Home', searchQuery: null }),
    [2, 6]
  );

  assert(
    'Category "Beauty" only',
    getFilteredRentals(mockListings, { selectedCategory: 'Beauty', searchQuery: null }),
    [9]
  );

  // --- Scenario B: search only ---
  assert(
    'Search "camera" (global — matches title, description, tags)',
    getFilteredRentals(mockListings, { selectedCategory: null, searchQuery: 'camera' }),
    [1, 7, 11] // Canon camera, Nikon lens (tag), DJI drone (tag)
  );

  assert(
    'Search "chair" (global — matches title of Yellow Armchair)',
    getFilteredRentals(mockListings, { selectedCategory: null, searchQuery: 'chair' }),
    [2]
  );

  assert(
    'Search "DSLR" (case-insensitive — matches tags and description)',
    getFilteredRentals(mockListings, { selectedCategory: null, searchQuery: 'DSLR' }),
    [1, 7]
  );

  assert(
    'Search "outdoor" (matches tags on braai and tent)',
    getFilteredRentals(mockListings, { selectedCategory: null, searchQuery: 'outdoor' }),
    [3, 8]
  );

  // --- Scenario C: combined (category + search) ---
  assert(
    'Category "Technology" + search "camera" → narrows within Tech',
    getFilteredRentals(mockListings, {
      selectedCategory: 'Technology',
      searchQuery: 'camera',
    }),
    [1, 7, 11] // All camera-related items in Technology
  );

  assert(
    'Category "Home" + search "yellow armchair" → narrows within Home',
    getFilteredRentals(mockListings, {
      selectedCategory: 'Home',
      searchQuery: 'yellow armchair',
    }),
    [2]
  );

  assert(
    'Category "Home & Garden Tools" + search "braai" → narrows within tools',
    getFilteredRentals(mockListings, {
      selectedCategory: 'Home & Garden Tools',
      searchQuery: 'braai',
    }),
    [3]
  );

  // --- Edge cases ---
  assert(
    'Empty strings treated as null → all available',
    getFilteredRentals(mockListings, { selectedCategory: '', searchQuery: '' }),
    [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12]
  );

  assert(
    'Search "macbook" (unavailable item — should not appear)',
    getFilteredRentals(mockListings, { selectedCategory: null, searchQuery: 'macbook' }),
    [] // id=4 is unavailable
  );

  assert(
    'Search "zzz_nonexistent" → empty array',
    getFilteredRentals(mockListings, { selectedCategory: null, searchQuery: 'zzz_nonexistent' }),
    []
  );

  console.log(`\n${passed} passed, ${failed} failed (${mockListings.length} listings)`);
  process.exit(failed > 0 ? 1 : 0);
}
/* c8 ignore stop */