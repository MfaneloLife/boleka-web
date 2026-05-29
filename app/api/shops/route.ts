import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get users who have active items
    const vendors = await prisma.user.findMany({
      where: {
        items: { some: { isActive: true } },
      },
      select: {
        id: true,
        name: true,
        image: true,
        city: true,
        region: true,
        businessName: true,
        _count: { select: { items: true } },
        // Get a sample of their items
        items: {
          where: { isActive: true },
          take: 4,
          orderBy: { createdAt: 'desc' },
          include: {
            images: { orderBy: { order: 'asc' } },
            reviews: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const shops = vendors
      .filter((v) => v._count.items > 0)
      .map((vendor) => ({
        id: vendor.id,
        name: vendor.businessName || vendor.name || 'Anonymous',
        image: vendor.image,
        location: [vendor.city, vendor.region].filter(Boolean).join(', '),
        itemCount: vendor._count.items,
        rating:
          vendor.items.reduce((sum, item) => {
            const ratings = item.reviews.map((r) => r.rating);
            return sum + (ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0);
          }, 0) / (vendor.items.length || 1),
        featuredItems: vendor.items.slice(0, 4).map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          imageUrl: item.images[0]?.url || null,
          category: item.category,
        })),
      }))
      .sort((a, b) => b.rating - a.rating);

    return NextResponse.json({ shops });
  } catch (error) {
    console.error('shops GET error:', error);
    return NextResponse.json({ shops: [] }, { status: 500 });
  }
}