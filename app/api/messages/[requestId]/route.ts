import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requestRecord = await prisma.request.findUnique({
    where: { id: params.requestId },
    include: {
      item: { include: { images: { orderBy: { order: 'asc' } } } },
      requester: { select: { id: true, name: true, image: true } },
      owner: { select: { id: true, name: true, image: true } },
    },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const userId = session.userId;
  if (userId !== requestRecord.requesterId && userId !== requestRecord.ownerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { requestId: params.requestId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({
    request: {
      id: requestRecord.id,
      item: {
        id: requestRecord.item.id,
        title: requestRecord.item.title,
        imageUrls: requestRecord.item.images.map((image) => image.url),
      },
      requester: {
        id: requestRecord.requester.id,
        name: requestRecord.requester.name,
        image: requestRecord.requester.image,
      },
      owner: {
        id: requestRecord.owner.id,
        name: requestRecord.owner.name,
        image: requestRecord.owner.image,
      },
      status: requestRecord.status,
      updatedAt: requestRecord.updatedAt.toISOString(),
    },
    messages: messages.map((message) => ({
      id: message.id,
      content: message.content,
      imageUrl: message.imageUrl,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        image: message.sender.image,
      },
    })),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { content, imageBase64 } = body as { content?: string; imageBase64?: string };

  if (!content && !imageBase64) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }

  const requestRecord = await prisma.request.findUnique({
    where: { id: params.requestId },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const userId = session.userId;
  if (userId !== requestRecord.requesterId && userId !== requestRecord.ownerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const newMessage = await prisma.message.create({
    data: {
      requestId: params.requestId,
      senderId: userId,
      content: content ?? '[Image]',
      imageUrl: null,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({
    id: newMessage.id,
    content: newMessage.content,
    imageUrl: newMessage.imageUrl,
    createdAt: newMessage.createdAt.toISOString(),
    sender: {
      id: newMessage.sender.id,
      name: newMessage.sender.name,
      image: newMessage.sender.image,
    },
  }, { status: 201 });
}
