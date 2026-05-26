import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const items = await prisma.item.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 12,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    const mapped = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price,
      location: item.address || 'Location not specified',
      imageUrl: item.images?.[0]?.url || null,
      category: item.category,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json({ items: mapped });
  } catch (error) {
    console.error('Error fetching featured items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured items' },
      { status: 500 }
    );
  }
}
