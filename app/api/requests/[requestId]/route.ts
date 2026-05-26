import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

function isValidStatusTransition(
  currentStatus: string,
  newStatus: string,
  currentUserId: string,
  requesterId: string,
  ownerId: string
) {
  if (newStatus === currentStatus) {
    return true;
  }

  const isOwner = currentUserId === ownerId;
  const isRequester = currentUserId === requesterId;

  if (isOwner) {
    if (currentStatus === 'PENDING' && (newStatus === 'ACCEPTED' || newStatus === 'REJECTED')) {
      return true;
    }
    if (currentStatus === 'COMPLETED' && newStatus === 'PAID') {
      return true;
    }
  }

  if (isRequester) {
    if (currentStatus === 'PENDING' && newStatus === 'CANCELLED') {
      return true;
    }
    if (currentStatus === 'ACCEPTED' && newStatus === 'COMPLETED') {
      return true;
    }
  }

  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requestRecord = await prisma.request.findUnique({
    where: { id: params.requestId },
    include: {
      item: { include: { images: { orderBy: { order: 'asc' } } } },
      requester: { select: { id: true, name: true, image: true, email: true } },
      owner: { select: { id: true, name: true, image: true, email: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (userId !== requestRecord.requesterId && userId !== requestRecord.ownerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json({
    id: requestRecord.id,
    status: requestRecord.status,
    item: {
      id: requestRecord.item.id,
      title: requestRecord.item.title,
      imageUrls: requestRecord.item.images.map((image) => image.url),
    },
    requester: {
      id: requestRecord.requester.id,
      name: requestRecord.requester.name,
      image: requestRecord.requester.image,
      email: requestRecord.requester.email,
    },
    owner: {
      id: requestRecord.owner.id,
      name: requestRecord.owner.name,
      image: requestRecord.owner.image,
      email: requestRecord.owner.email,
    },
    totalPrice: requestRecord.totalPrice,
    startDate: requestRecord.startDate?.toISOString() ?? null,
    endDate: requestRecord.endDate?.toISOString() ?? null,
    lastMessage: requestRecord.messages[0]
      ? {
          id: requestRecord.messages[0].id,
          content: requestRecord.messages[0].content,
          createdAt: requestRecord.messages[0].createdAt.toISOString(),
          senderId: requestRecord.messages[0].senderId,
        }
      : null,
    updatedAt: requestRecord.updatedAt.toISOString(),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const requestRecord = await prisma.request.findUnique({
    where: { id: params.requestId },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  if (userId !== requestRecord.requesterId && userId !== requestRecord.ownerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  if (body.status && !isValidStatusTransition(requestRecord.status, body.status, userId, requestRecord.requesterId, requestRecord.ownerId)) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
  }

  const updateData: any = { updatedAt: new Date() };
  if (body.status) updateData.status = body.status;
  if (body.startDate) updateData.startDate = new Date(body.startDate);
  if (body.endDate) updateData.endDate = new Date(body.endDate);
  if (body.totalPrice !== undefined) updateData.totalPrice = Number(body.totalPrice);

  const updatedRequest = await prisma.request.update({
    where: { id: params.requestId },
    data: updateData,
  });

  return NextResponse.json({
    id: updatedRequest.id,
    status: updatedRequest.status,
    totalPrice: updatedRequest.totalPrice,
    startDate: updatedRequest.startDate?.toISOString() ?? null,
    endDate: updatedRequest.endDate?.toISOString() ?? null,
    updatedAt: updatedRequest.updatedAt.toISOString(),
  });
}
