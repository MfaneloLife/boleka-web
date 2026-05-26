import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.userId;
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
  const session = await auth();
  if (!session?.user?.id) {
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

  const newRequest = await prisma.request.create({
    data: {
      itemId: item.id,
      requesterId: session.userId,
      ownerId: item.userId,
      status: 'PENDING',
      totalPrice: item.price,
      messages: message
        ? {
            create: {
              senderId: session.userId,
              content: message.trim(),
            },
          }
        : undefined,
    },
  });

  return NextResponse.json({ id: newRequest.id }, { status: 201 });
}
