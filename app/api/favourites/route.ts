import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const favourites = await prisma.favourite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          include: {
            images: { orderBy: { order: 'asc' } },
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return NextResponse.json(
      favourites.map((fav) => ({
        id: fav.id,
        createdAt: fav.createdAt.toISOString(),
        item: {
          id: fav.item.id,
          title: fav.item.title,
          price: fav.item.price,
          category: fav.item.category,
          imageUrl: fav.item.images[0]?.url || null,
          imageUrls: fav.item.images.map((img) => img.url),
          owner: fav.item.user,
        },
      }))
    );
  } catch (error) {
    console.error('favourites GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch favourites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    // Check if already favourited
    const existing = await prisma.favourite.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });

    if (existing) {
      // Unfavourite (toggle off)
      await prisma.favourite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favourited: false });
    }

    // Favourite (toggle on)
    await prisma.favourite.create({
      data: { userId, itemId },
    });

    return NextResponse.json({ favourited: true });
  } catch (error) {
    console.error('favourites POST error:', error);
    return NextResponse.json({ error: 'Failed to toggle favourite' }, { status: 500 });
  }
}