import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    ? item.images.map((image: { url: string }) => normalizeImageUrl(image.url)).filter((url: string | null): url is string => url !== null)
    : [];

  return {
    ...item,
    imageUrl: imageUrls[0] || null,
    imageUrls,
    location: item.address || null,
    ownerId: item.userId || (item.user ? item.user.id : null),
    itemType: item.itemType || null,
    rentalPrice: item.rentalPrice ?? null,
  };
}

/**
 * GET /api/items/weekly?weekStart=ISO_DATE
 * Fetches the 6 weekly picks for a given week
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const weekStartParam = url.searchParams.get('weekStart');

    // If no week provided, use current week
    let weekStart: Date;
    if (weekStartParam) {
      weekStart = new Date(weekStartParam);
    } else {
      const now = new Date();
      const sastTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const day = sastTime.getDay();
      const diff = sastTime.getDate() - day + (day === 0 ? -6 : 1);
      weekStart = new Date(sastTime.getFullYear(), sastTime.getMonth(), diff);
      weekStart.setHours(0, 0, 0, 0);
    }

    // Fetch weekly picks ordered by position
    const picks = await prisma.weeklyPick.findMany({
      where: { weekStart },
      orderBy: { position: 'asc' },
      include: {
        item: {
          include: {
            user: { select: { id: true, name: true, image: true } },
            images: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    const items = picks.map((pick) => normalizeItem(pick.item));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/items/weekly error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
