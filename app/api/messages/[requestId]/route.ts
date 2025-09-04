import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getMessagesForRequest, sendMessage } from '@/lib/firebaseUtils';

const prisma = new PrismaClient();

// GET messages for a specific request
export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { requestId } = params;

    // Verify the user is part of this conversation (either requester or owner)
    const userRequest = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
      include: {
        requester: true,
        owner: true,
      },
    });

    if (!userRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user is part of this conversation
    if (user.id !== userRequest.requesterId && user.id !== userRequest.ownerId) {
      return NextResponse.json(
        { error: 'You do not have permission to view these messages' },
        { status: 403 }
      );
    }

    // Get messages from Firebase
    const messages = await getMessagesForRequest(requestId);

    return NextResponse.json({
      request: userRequest,
      messages,
    });
  } catch (error) {
    console.error('GET_MESSAGES_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST a new message
export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { requestId } = params;
    const body = await request.json();
    const { content, imageBase64, imageType } = body;

    if (!content && !imageBase64) {
      return NextResponse.json(
        { error: 'Message content or image is required' },
        { status: 400 }
      );
    }

    // Verify the user is part of this conversation (either requester or owner)
    const userRequest = await prisma.request.findUnique({
      where: {
        id: requestId,
      },
      include: {
        requester: true,
        owner: true,
      },
    });

    if (!userRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user is part of this conversation
    if (user.id !== userRequest.requesterId && user.id !== userRequest.ownerId) {
      return NextResponse.json(
        { error: 'You do not have permission to send messages in this conversation' },
        { status: 403 }
      );
    }

    // Create the message in Firebase
    const messageData = {
      content: content || '',
      senderId: user.id,
      senderName: user.name || 'User',
      senderImage: user.image,
      requestId,
    };
    
    // Send message to Firebase
    const firebaseMessage = await sendMessage(messageData, imageBase64, imageType);

    // Also create in Prisma for backward compatibility
    const message = await prisma.message.create({
      data: {
        content: content || 'Sent an image',
        senderId: user.id,
        requestId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...firebaseMessage,
      prismaId: message.id
    }, { status: 201 });
  } catch (error) {
    console.error('POST_MESSAGE_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
