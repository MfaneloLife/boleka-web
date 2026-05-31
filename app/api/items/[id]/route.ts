import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || url.trim() === '') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `${R2_PUBLIC_URL}${trimmed}`;
  return `${R2_PUBLIC_URL}/${trimmed}`;
}

function normalizeItem(item: any) {
  const imageUrls = Array.isArray(item.images)
    ? item.images.map((image: any) => normalizeImageUrl(image.url)).filter((url: string | null): url is string => url !== null)
    : [];

  return {
    ...item,
    imageUrl: imageUrls[0] || null,
    imageUrls,
    location: item.address || null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const item = await prisma.item.findUnique({
      where: { id },
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

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(normalizeItem(item));
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.userId !== session.userId) {
      return NextResponse.json({ error: 'Not authorized to update this item' }, { status: 403 });
    }

    const body = await req.json();
    const imageUrls = [];
    if (body.imageUrl) imageUrls.push(body.imageUrl);
    if (Array.isArray(body.images)) {
      imageUrls.push(...body.images.filter((url: any) => typeof url === 'string'));
    }

    if (imageUrls.length > 0) {
      await prisma.itemImage.deleteMany({ where: { itemId: id } });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        title: body.title ?? item.title,
        description: body.description ?? item.description,
        category: body.category ?? item.category,
        condition: body.condition ?? item.condition,
        price: body.price !== undefined ? Number(body.price) : item.price,
        quantity: body.quantity !== undefined ? Number(body.quantity) : item.quantity,
        lat: body.lat !== undefined ? Number(body.lat) : item.lat,
        lng: body.lng !== undefined ? Number(body.lng) : item.lng,
        address: body.address ?? item.address,
        allowCollection: body.allowCollection !== undefined ? body.allowCollection : item.allowCollection,
        allowDelivery: body.allowDelivery !== undefined ? body.allowDelivery : item.allowDelivery,
        deliveryFee: body.deliveryFee !== undefined ? Number(body.deliveryFee) : item.deliveryFee,
        images: imageUrls.length
          ? {
              create: imageUrls.map((url: string, index: number) => ({
                url,
                order: index,
              })),
            }
          : undefined,
      },
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

    return NextResponse.json(normalizeItem(updatedItem));
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.userId !== session.userId) {
      return NextResponse.json({ error: 'Not authorized to delete this item' }, { status: 403 });
    }

    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}