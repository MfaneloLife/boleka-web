import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getMessagesForRequest, sendMessage } from '@/lib/firebaseUtils';
import { adminDb } from '@/src/lib/firebase-admin';

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

    // Verify the request exists and get user info
    const requestSnapshot = await adminDb.collection('requests').doc(requestId).get();
    
    if (!requestSnapshot.exists) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const requestData = requestSnapshot.data();

    // Get user info from Firebase
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', session.user.email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = usersSnapshot.docs[0];
    const userData = user.data();

    // Check if the user is part of this conversation
    if (userData.id !== requestData?.requesterId && userData.id !== requestData?.ownerId) {
      return NextResponse.json(
        { error: 'You do not have permission to view these messages' },
        { status: 403 }
      );
    }

    // Get messages from Firebase
    const messages = await getMessagesForRequest(requestId);

    return NextResponse.json({
      request: {
        id: requestSnapshot.id,
        ...requestData
      },
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

    // Verify the request exists
    const requestSnapshot = await adminDb.collection('requests').doc(requestId).get();
    
    if (!requestSnapshot.exists) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const requestData = requestSnapshot.data();

    // Get user info from Firebase
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', session.user.email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = usersSnapshot.docs[0];
    const userData = user.data();

    // Check if the user is part of this conversation
    if (userData.id !== requestData?.requesterId && userData.id !== requestData?.ownerId) {
      return NextResponse.json(
        { error: 'You do not have permission to send messages in this conversation' },
        { status: 403 }
      );
    }

    // Create the message in Firebase
    const messageData = {
      content: content || '',
      senderId: user.id,
      senderName: userData.name || 'User',
      senderImage: userData.image,
      requestId,
    };
    
    // Send message to Firebase
    const firebaseMessage = await sendMessage(messageData, imageBase64, imageType);

    return NextResponse.json(firebaseMessage, { status: 201 });
  } catch (error) {
    console.error('POST_MESSAGE_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
