import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function normalizeItem(item: any) {
  const imageUrls = Array.isArray(item.images)
    ? item.images.map((image: any) => image.url).filter(Boolean)
    : [];

  return {
    ...item,
    imageUrl: imageUrls[0] || null,
    imageUrls,
    location: item.address || null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const location = url.searchParams.get('location');
    const searchTerm = url.searchParams.get('search') || '';
    const ownerIdParam = url.searchParams.get('ownerId');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');

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

    const where: any = {};
    if (ownerId) where.userId = ownerId;
    if (category) where.category = category;
    if (location) {
      where.address = { contains: location, mode: 'insensitive' };
    }
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!Number.isNaN(min) && !Number.isNaN(max)) {
        where.price = { gte: min, lte: max };
      }
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
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ items: items.map(normalizeItem) });
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

    const itemData: any = {
      title,
      description: body.description || null,
      category,
      condition,
      price: Number(price),
      quantity: Number.isFinite(Number(body.quantity)) ? Number(body.quantity) : 1,
      lat: body.lat !== undefined ? Number(body.lat) : null,
      lng: body.lng !== undefined ? Number(body.lng) : null,
      address: body.address || body.location || null,
      allowCollection: body.allowCollection !== false,
      allowDelivery: body.allowDelivery !== false,
      deliveryFee: Number.isFinite(Number(body.deliveryFee)) ? Number(body.deliveryFee) : 0,
      userId: session.userId,
    };

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
