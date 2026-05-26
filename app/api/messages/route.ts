import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.userId;

  const conversations = await prisma.request.findMany({
    where: {
      OR: [{ requesterId: userId }, { ownerId: userId }],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      item: { include: { images: { orderBy: { order: 'asc' } } } },
      requester: { select: { id: true, name: true, image: true } },
      owner: { select: { id: true, name: true, image: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(
    conversations.map((conversation) => ({
      id: conversation.id,
      item: {
        id: conversation.item.id,
        title: conversation.item.title,
        imageUrls: conversation.item.images.map((image) => image.url),
      },
      requester: {
        id: conversation.requester.id,
        name: conversation.requester.name,
        image: conversation.requester.image,
      },
      owner: {
        id: conversation.owner.id,
        name: conversation.owner.name,
        image: conversation.owner.image,
      },
      status: conversation.status,
      lastMessage: conversation.messages[0]
        ? {
            id: conversation.messages[0].id,
            content: conversation.messages[0].content,
            createdAt: conversation.messages[0].createdAt.toISOString(),
            senderId: conversation.messages[0].senderId,
          }
        : null,
      messageCount: conversation._count.messages,
      updatedAt: conversation.updatedAt.toISOString(),
    }))
  );
}
