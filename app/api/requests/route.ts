import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get('type');

  const whereClause =
    type === 'sent'
      ? { requesterId: userId }
      : type === 'received'
      ? { ownerId: userId }
      : { OR: [{ requesterId: userId }, { ownerId: userId }] };

  const requests = await prisma.request.findMany({
    where: whereClause,
    orderBy: { updatedAt: 'desc' },
    include: {
      item: { include: { images: { orderBy: { order: 'asc' } } } },
      requester: { select: { id: true, name: true, image: true, email: true } },
      owner: { select: { id: true, name: true, image: true, email: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(
    requests.map((request) => ({
      id: request.id,
      status: request.status,
      item: {
        id: request.item.id,
        title: request.item.title,
        imageUrls: request.item.images.map((image) => image.url),
      },
      requester: {
        id: request.requester.id,
        name: request.requester.name,
        image: request.requester.image,
        email: request.requester.email,
      },
      owner: {
        id: request.owner.id,
        name: request.owner.name,
        image: request.owner.image,
        email: request.owner.email,
      },
      lastMessage: request.messages[0]
        ? {
            id: request.messages[0].id,
            content: request.messages[0].content,
            createdAt: request.messages[0].createdAt.toISOString(),
            senderId: request.messages[0].senderId,
          }
        : null,
      messageCount: request._count.messages,
      updatedAt: request.updatedAt.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { itemId, message } = body as { itemId?: string; message?: string };
  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { id: String(itemId) },
    include: { images: { orderBy: { order: 'asc' } } },
  });

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  // Prevent duplicate active requests for the same item by the same user.
  // "Active" = any status that isn't terminal (REJECTED, CANCELLED, COMPLETED).
  const existingActive = await prisma.request.findFirst({
    where: {
      itemId: item.id,
      requesterId: userId,
      status: { notIn: ['REJECTED', 'CANCELLED', 'COMPLETED'] },
    },
  });

  if (existingActive) {
    return NextResponse.json(
      {
        error: 'You already have an active request for this item.',
        existingRequestId: existingActive.id,
      },
      { status: 409 }
    );
  }

  const newRequest = await prisma.request.create({
    data: {
      itemId: item.id,
      requesterId: userId,
      ownerId: item.userId,
      status: 'PENDING',
      totalPrice: item.price,
      messages: message
        ? {
            create: {
              senderId: userId,
              content: message.trim(),
            },
          }
        : undefined,
    },
  });

  // Create notification for the item owner
  try {
    await prisma.notification.create({
      data: {
        userId: item.userId,
        type: 'REQUEST_CREATED',
        title: 'New rental request',
        message: message?.substring(0, 100) ?? 'Someone wants to rent your item',
        relatedId: newRequest.id,
      },
    });
  } catch (notifErr) {
    console.error('Failed to create notification:', notifErr);
  }

  return NextResponse.json({ id: newRequest.id }, { status: 201 });
}
