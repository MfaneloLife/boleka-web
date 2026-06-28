import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });
}

/** Extract the R2 object key from an image URL */
function getKeyFromUrl(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    return url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
  } catch {
    return null;
  }
}

/** Delete an image from R2 by its URL */
async function deleteR2Image(imageUrl: string): Promise<void> {
  const key = getKeyFromUrl(imageUrl);
  if (!key) return;
  try {
    const r2 = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'bolekaweb',
      Key: key,
    });
    await r2.send(command);
  } catch (err) {
    console.error('Failed to delete R2 image:', key, err);
  }
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
      requester: { select: { id: true, name: true, image: true } },
      owner: { select: { id: true, name: true, image: true } },
    },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

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
        price: requestRecord.item.price,
        userId: requestRecord.item.userId,
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
      totalPrice: requestRecord.totalPrice,
      finalValue: requestRecord.finalValue,
      paymentMethod: requestRecord.paymentMethod,
      startDate: requestRecord.startDate?.toISOString() ?? null,
      endDate: requestRecord.endDate?.toISOString() ?? null,
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
  const { userId } = await auth();
  if (!userId) {
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

  if (userId !== requestRecord.requesterId && userId !== requestRecord.ownerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Upload image to R2 if provided
  let imageUrl: string | null = null;
  if (imageBase64) {
    try {
      const r2 = getR2Client();
      const buffer = Buffer.from(imageBase64, 'base64');
      const ext = 'jpg'; // Default to jpg for compressed images
      const key = `messages/${params.requestId}/${crypto.randomUUID()}.${ext}`;
      
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'bolekaweb',
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
      });
      
      await r2.send(command);
      imageUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    } catch (uploadError) {
      console.error('Failed to upload message image to R2:', uploadError);
      // Continue without image - don't fail the whole message
    }
  }

  const newMessage = await prisma.message.create({
    data: {
      requestId: params.requestId,
      senderId: userId,
      content: content ?? '[Image]',
      imageUrl: imageUrl,
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  // Create notification for the other party
  const recipientId = userId === requestRecord.requesterId
    ? requestRecord.ownerId
    : requestRecord.requesterId;

  try {
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'MESSAGE_RECEIVED',
        title: 'New message received',
        message: content?.substring(0, 100) ?? 'Image sent',
        relatedId: params.requestId,
      },
    });
  } catch (notifErr) {
    console.error('Failed to create notification:', notifErr);
    // Don't fail the message send if notification creation fails
  }

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('messageId');

  if (!messageId) {
    // Delete ALL old messages with images (cleanup — called by cron)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldMessages = await prisma.message.findMany({
      where: {
        imageUrl: { not: null },
        createdAt: { lt: thirtyDaysAgo },
      },
      select: { id: true, imageUrl: true, senderId: true },
    });

    // Delete images from R2
    for (const msg of oldMessages) {
      if (msg.imageUrl) {
        await deleteR2Image(msg.imageUrl);
      }
    }

    // Delete the message records
    const deleted = await prisma.message.deleteMany({
      where: {
        imageUrl: { not: null },
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
      cleanedImages: oldMessages.length,
    });
  }

  // Delete a specific message
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  if (message.senderId !== userId) {
    return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 });
  }

  if (!message.imageUrl && !message.content) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  // Delete image from R2 if exists
  if (message.imageUrl) {
    await deleteR2Image(message.imageUrl);
  }

  // Delete from database
  await prisma.message.delete({ where: { id: messageId } });

  return NextResponse.json({ success: true });
}
