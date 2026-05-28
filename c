import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get bookings where user is either renter or vendor
  const orders = await prisma.booking.findMany({
    where: {
      OR: [{ userId }, { item: { userId } }],
    },
    include: {
      item: {
        include: { images: { orderBy: { order: 'asc' } } },
      },
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      status: order.status.toLowerCase(),
      total: order.totalPrice,
      deliveryMethod: order.deliveryMethod,
      returnStatus: order.returnStatus,
      startDate: order.startDate.toISOString(),
      endDate: order.endDate?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      item: {
        title: order.item.title,
        images: order.item.images.map((img) => img.url),
      },
      renter: {
        id: order.user.id,
        name: order.user.name,
        image: order.user.image,
      },
    })),
  });
}
