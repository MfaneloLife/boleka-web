import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveCategoryFromSlug } from '@/app/api/categories/route';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-0bf9994c37384a93b6f02dc5dc60ec44.r2.dev';

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `${R2_PUBLIC_URL}${trimmed}`;
  return `${R2_PUBLIC_URL}/${trimmed}`;
}

function normalizeItem(item: any) {
  const imageUrls = Array.isArray(item.images)
    ? item.images.map((image: any) => normalizeImageUrl(image.url)).filter((url): url is string => url !== null)
    : [];

  return {
    ...item,
    imageUrl: imageUrls[0] || null,
    imageUrls,
    location: item.address || null,
    ownerId: item.userId || (item.user ? item.user.id : null),
    itemType: item.itemType || null,
    // For RENTING: price is the daily rate; for SELLING: price is the sale price;
    // for BOTH: price is the sale price, rentalPrice is the daily rental rate.
    rentalPrice: item.rentalPrice ?? null,
  };
}

/**
 * Build relevance-scored search query using PostgreSQL ts_rank or ordered OR.
 * Strategy: Score exact title matches highest, then title contains, then description contains, then tags.
 */
function buildSearchWhere(searchTerm: string) {
  const tokens = searchTerm.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return {};

  // For single tokens or multiple tokens, build cascading OR conditions
  // Prefer exact phrase match on title first, then individual word matches
  const phrase = searchTerm.trim();

  return {
    OR: [
      // Priority 1: Exact phrase match in title (most relevant)
      { title: { contains: phrase, mode: 'insensitive' as const } },
      // Priority 2: Title contains any token
      ...tokens.map((token) => ({
        title: { contains: token, mode: 'insensitive' as const },
      })),
      // Priority 3: Description contains phrase
      { description: { contains: phrase, mode: 'insensitive' as const } },
      // Priority 4: Description contains any token
      ...tokens.map((token) => ({
        description: { contains: token, mode: 'insensitive' as const },
      })),
      // Priority 5: Tags contain phrase
      { tags: { contains: phrase, mode: 'insensitive' as const } },
      // Priority 6: Tags contain any token
      ...tokens.map((token) => ({
        tags: { contains: token, mode: 'insensitive' as const },
      })),
    ],
  };
}

function computeRelevanceScore(item: any, searchTerm: string): number {
  const term = searchTerm.toLowerCase().trim();
  const tokens = term.split(/\s+/).filter(Boolean);
  const title = (item.title || '').toLowerCase();
  const description = (item.description || '').toLowerCase();
  const tags = (item.tags || '').toLowerCase();
  let score = 0;

  // Exact phrase match on title: +100
  if (title.includes(term)) score += 100;
  // Individual token matches in title: +30 each
  for (const token of tokens) {
    if (title.includes(token)) score += 30;
  }
  // Exact phrase match in description: +20
  if (description.includes(term)) score += 20;
  // Individual token matches in description: +8 each
  for (const token of tokens) {
    if (description.includes(token)) score += 8;
  }
  // Exact phrase match in tags: +15
  if (tags.includes(term)) score += 15;
  // Individual token matches in tags: +5 each
  for (const token of tokens) {
    if (tags.includes(token)) score += 5;
  }

  return score;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchTerm = url.searchParams.get('q') || '';
    const categorySlug = url.searchParams.get('category') || '';
    const location = url.searchParams.get('location') || '';
    const minPrice = url.searchParams.get('minPrice') || '';
    const maxPrice = url.searchParams.get('maxPrice') || '';
    const itemType = url.searchParams.get('itemType') || ''; // SELLING, RENTING, BOTH
    const sort = url.searchParams.get('sort') || 'newest'; // newest, price_asc, price_desc, relevant
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '24', 10)));

    const where: any = {
      isActive: true,
      quantity: { gt: 0 },
    };

    // Resolve category slug → DB category ID
    if (categorySlug) {
      const dbCategoryId = resolveCategoryFromSlug(categorySlug);
      if (dbCategoryId) {
        where.category = dbCategoryId;
      }
    }

    // Location filter
    if (location) {
      where.address = { contains: location, mode: 'insensitive' as const };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        const min = parseFloat(minPrice);
        if (!Number.isNaN(min)) where.price.gte = min;
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice);
        if (!Number.isNaN(max)) where.price.lte = max;
      }
    }

    // Item type filter (RENTING / SELLING / BOTH)
    if (itemType && ['SELLING', 'RENTING', 'BOTH'].includes(itemType)) {
      where.itemType = itemType;
    }

    // Search term (multi-field with relevance)
    const hasSearchTerm = searchTerm.trim().length > 0;
    if (hasSearchTerm) {
      const searchWhere = buildSearchWhere(searchTerm);
      if (Object.keys(searchWhere).length > 0) {
        where.OR = (searchWhere as any).OR;
      }
    }

    // Build orderBy
    let orderBy: any;
    if (hasSearchTerm && sort === 'relevant') {
      // For relevance sort, we'll fetch and compute relevance client-side
      // Fetch more items, then score, sort, and paginate
      const items = await prisma.item.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          images: { orderBy: { order: 'asc' as const } },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 200,
      });

      let normalized = items.map(normalizeItem);

      // Compute relevance score for each
      const scored = normalized.map((item) => ({
        ...item,
        _score: computeRelevanceScore(item, searchTerm),
      }));

      // Filter out zero-score items
      const relevant = scored.filter((item) => item._score > 0);

      // Sort by score descending
      relevant.sort((a, b) => b._score - a._score);

      // Paginate
      const total = relevant.length;
      const offset = (page - 1) * limit;
      const paged = relevant.slice(offset, offset + limit);

      // Remove internal _score from output
      const result = paged.map(({ _score, ...rest }) => rest);

      return NextResponse.json({
        items: result,
        total,
        page,
        limit,
        hasMore: offset + limit < total,
      });
    }

    // Standard sort
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' as const };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' as const };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' as const };
        break;
    }

    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true } },
          images: { orderBy: { order: 'asc' as const } },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.item.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map(normalizeItem),
      total,
      page,
      limit,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('search.error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}