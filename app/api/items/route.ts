import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { slugToLabel } from '@/lib/search-filters';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-0bf9994c37384a93b6f02dc5dc60ec44.r2.dev';

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  const trimmed = url.trim();
  // Already a full URL
  if (trimmed.startsWith('https://')) return trimmed;
  // Absolute path
  if (trimmed.startsWith('/')) return `${R2_PUBLIC_URL}${trimmed}`;
  // Just a filename — prepend R2 public URL
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
 * Convert a weekly seed string (e.g. "2026-15") to a float in [0, 1).
 * Uses djb2 to produce a deterministic float for PostgreSQL SETSEED.
 */
function hashToFloat(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 1_000_000) / 1_000_000;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const location = url.searchParams.get('location');
    // 'q' is the free-text search query; 'search' is kept for backward compatibility
    const searchTerm = url.searchParams.get('q') || url.searchParams.get('search') || '';
    const ownerIdParam = url.searchParams.get('ownerId');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const weeklyMode = url.searchParams.get('weekly') === 'true';
    const seedParam = url.searchParams.get('seed') || '';

    let ownerId: string | null = null;
    if (ownerIdParam === 'me') {
      const session = await auth();
      if (!session.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      ownerId = session.userId;
    } else if (ownerIdParam) {
      ownerId = ownerIdParam;
    }

    const where: any = {
      isActive: true,
    };

    // When fetching public items (no owner filter), exclude out-of-stock items
    if (!ownerId) {
      where.quantity = { gt: 0 };
    }

    if (ownerId) where.userId = ownerId;
    if (category) {
      // Convert slug to display label for DB matching (e.g. "electronics-tech" → "Electronics & Technology")
      where.category = slugToLabel(category);
    }
    if (location) {
      where.address = { contains: location, mode: 'insensitive' };
    }
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!Number.isNaN(min) && !Number.isNaN(max)) {
        where.price = { gte: min, lte: max };
      }
    }

    // ── WEEKLY PICKS mode ──
    if (weeklyMode && seedParam) {
      const seedNumber = hashToFloat(seedParam);

      // Seed PostgreSQL's RANDOM() so ORDER BY RANDOM() is deterministic for the week
      await prisma.$executeRawUnsafe(`SELECT setseed(${seedNumber})`);

      const picks = await prisma.item.findMany({
        where,
        take: 8,
        include: {
          user: { select: { id: true, name: true, image: true } },
          images: { orderBy: { order: 'asc' } },
        },
        orderBy: { id: 'asc' },
      });

      return NextResponse.json({
        items: picks.map(normalizeItem),
        nextCursor: null,
      });
    }

    // ── Normal paginated mode ──
    const cursorParam = url.searchParams.get('cursor');
    const limitParam = url.searchParams.get('limit');
    const sort = url.searchParams.get('sort') || 'newest';
    const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 12, 50) : 12;

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'relevance':
      default:
        // When searching, relevance = newest (can add scoring later)
        orderBy = { createdAt: 'desc' };
        break;
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy,
      take: limit + 1, // fetch one extra to detect if there's a next page
      ...(cursorParam ? { skip: 1, cursor: { id: cursorParam } } : {}),
    });

    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? resultItems[resultItems.length - 1]?.id : null;

    return NextResponse.json({
      items: resultItems.map(normalizeItem),
      nextCursor,
    });
  } catch (error) {
    console.error('items.error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
    const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || clerkUser?.fullName || null;
    const image = clerkUser?.imageUrl || null;

    await prisma.user.upsert({
      where: { id: session.userId },
      update: {
        email,
        name,
        image,
      },
      create: {
        id: session.userId,
        email,
        name,
        image,
      },
    });

    const contentType = req.headers.get('content-type') || '';
    let body: any;
    if (contentType.includes('application/json')) {
      body = await req.json().catch(() => ({}));
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      body = {
        title: (formData.get('title') as string) || (formData.get('name') as string),
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        condition: (formData.get('condition') as string) || 'used',
        price: parseFloat((formData.get('price') as string) || (formData.get('dailyPrice') as string) || ''),
        quantity: parseInt((formData.get('quantity') as string) || '1', 10),
        address: formData.get('location') as string || formData.get('address') as string,
        imageUrl: formData.get('imageUrl') as string || formData.get('image')?.toString(),
        images: formData.getAll('images').map((entry) => typeof entry === 'string' ? entry : null).filter(Boolean),
        allowCollection: formData.get('allowCollection') !== 'false',
        allowDelivery: formData.get('allowDelivery') !== 'false',
        deliveryFee: parseFloat((formData.get('deliveryFee') as string) || '0'),
      };
    } else {
      body = await req.json().catch(() => ({}));
    }

    const title = body.title || body.name;
    const price = body.price ?? body.dailyPrice;
    const condition = body.condition || 'used';
    const category = body.category;

    if (!title || !category || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category, and price are required' },
        { status: 400 }
      );
    }

    const imageUrls = [];
    if (body.imageUrl) imageUrls.push(body.imageUrl);
    if (Array.isArray(body.images)) {
      imageUrls.push(...body.images.filter((url: any) => typeof url === 'string'));
    }

    // itemType handling — default to RENTING if not provided (matches form default)
    const rawItemType = body.itemType ? String(body.itemType).toUpperCase() : '';
    const validTypes: string[] = ['SELLING', 'RENTING', 'BOTH'];
    const itemType: string = validTypes.includes(rawItemType) ? rawItemType : 'RENTING';

    const itemData: any = {
      title,
      description: body.description || null,
      category,
      condition,
      price: Number(price),
      itemType,
      quantity: Number.isFinite(Number(body.quantity)) ? Number(body.quantity) : 1,
      lat: body.lat !== undefined ? Number(body.lat) : null,
      lng: body.lng !== undefined ? Number(body.lng) : null,
      address: body.address || body.location || null,
      allowCollection: body.allowCollection !== false,
      allowDelivery: body.allowDelivery !== false,
      deliveryFee: Number.isFinite(Number(body.deliveryFee)) ? Number(body.deliveryFee) : 0,
      userId: session.userId,
    };

    // rentalPrice — only meaningful for BOTH (separate daily rate) and RENTING
    if (body.rentalPrice !== undefined && body.rentalPrice !== null && body.rentalPrice !== '') {
      const rp = Number(body.rentalPrice);
      if (Number.isFinite(rp) && rp > 0) {
        itemData.rentalPrice = rp;
      }
    }

    if (imageUrls.length > 0) {
      itemData.images = {
        create: imageUrls.map((url: string, index: number) => ({
          url,
          order: index,
        })),
      };
    }

    const item = await prisma.item.create({
      data: itemData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(normalizeItem(item), { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const itemId = url.searchParams.get('id');
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.userId !== session.userId) {
      return NextResponse.json({ error: 'Not your item' }, { status: 403 });
    }

    // Delete related images, then the item
    await prisma.itemImage.deleteMany({ where: { itemId } });
    await prisma.item.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}