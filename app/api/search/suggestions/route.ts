import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CATEGORY_SLUG_MAP } from '@/lib/search-filters';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();

    if (query.length < 2) {
      return NextResponse.json({ products: [], categories: [], suggestions: [] });
    }

    // Fetch matching products (title/tags)
    const products = await prisma.item.findMany({
      where: {
        isActive: true,
        quantity: { gt: 0 },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { tags: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Match categories whose label contains the query
    const matchingCategories = Object.entries(CATEGORY_SLUG_MAP)
      .filter(([, label]) => label.toLowerCase().includes(query.toLowerCase()))
      .map(([slug, label]) => ({ slug, label }));

    // Generate suggestions
    const suggestions = [
      ...(matchingCategories.length > 0 ? [`${matchingCategories[0].label} for rent`] : []),
      `${query} for rent`,
      `${query} South Africa`,
      ...matchingCategories.slice(0, 2).map((c) => `Rent ${c.label}`),
    ].slice(0, 4);

    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-0bf9994c37384a93b6f02dc5dc60ec44.r2.dev';

    return NextResponse.json({
      products: products.map((p) => {
        const firstImg = p.images?.[0];
        const rawUrl = firstImg?.url || null;
        const imgUrl = rawUrl
          ? (rawUrl.startsWith('https://') ? rawUrl : `${R2_PUBLIC_URL}/${rawUrl}`)
          : null;
        return { id: p.id, title: p.title, price: p.price, imageUrl: imgUrl };
      }),
      categories: matchingCategories.slice(0, 4),
      suggestions,
    });
  } catch (error) {
    console.error('search suggestions error:', error);
    return NextResponse.json({ products: [], categories: [], suggestions: [] }, { status: 500 });
  }
}