import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/src/lib/firebase-admin';
import { getMessagesForRequest, sendMessage } from '@/lib/firebaseUtils';

// GET messages for a specific request
export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    // Verify Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;

    if (!token) {
      return NextResponse.json({ error: 'Missing Authorization token' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userEmail = decoded.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid token: missing email' }, { status: 401 });
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

    // Get user info from Firestore by email
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', userEmail)
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
  const userDocId = user.id;

    // Check if the user is part of this conversation
    const isParticipant =
      userDocId === requestData?.requesterId ||
      userDocId === requestData?.ownerId ||
      (Array.isArray(requestData?.participantIds) && requestData.participantIds.includes(userDocId));

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You do not have permission to view these messages' },
        { status: 403 }
      );
    }

    // Get messages from Firebase
    const messages = await getMessagesForRequest(requestId);

    // Build request summary for UI
    let itemSummary: any = { id: requestData?.itemId, title: requestData?.itemTitle, imageUrls: requestData?.itemImages || [], price: requestData?.itemPrice };
    try {
      if (requestData?.itemId) {
        const itemDoc = await adminDb.collection('items').doc(String(requestData.itemId)).get();
        if (itemDoc.exists) {
          const item = itemDoc.data();
          itemSummary = {
            id: itemDoc.id,
            title: item?.title,
            imageUrls: item?.imageUrls || [],
            price: item?.price,
          };
        }
      }
    } catch {}

    const [requesterDoc, ownerDoc] = await Promise.all([
      requestData?.requesterId ? adminDb.collection('users').doc(String(requestData.requesterId)).get() : null,
      requestData?.ownerId ? adminDb.collection('users').doc(String(requestData.ownerId)).get() : null,
    ]);

    const requester = requesterDoc && requesterDoc.exists ? requesterDoc.data() : null;
    const owner = ownerDoc && ownerDoc.exists ? ownerDoc.data() : null;

    return NextResponse.json({
      request: {
        id: requestSnapshot.id,
        item: {
          id: itemSummary?.id,
          title: itemSummary?.title,
          imageUrls: itemSummary?.imageUrls || [],
          price: itemSummary?.price ?? 0,
        },
        requester: requester
          ? { id: requestData?.requesterId, name: requester.name || 'User', image: requester.image || null }
          : { id: requestData?.requesterId, name: 'User', image: null },
        owner: owner
          ? { id: requestData?.ownerId, name: owner.name || 'User', image: owner.image || null }
          : { id: requestData?.ownerId, name: 'User', image: null },
        status: requestData?.status || 'open',
        createdAt: (requestData?.createdAt as any)?.toDate?.() || new Date(),
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
    // Verify Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;

    if (!token) {
      return NextResponse.json({ error: 'Missing Authorization token' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userEmail = decoded.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'Invalid token: missing email' }, { status: 401 });
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

    // Get user info from Firestore by email
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', userEmail)
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
  const userDocId = user.id;

    // Check if the user is part of this conversation
    const isParticipant =
      userDocId === requestData?.requesterId ||
      userDocId === requestData?.ownerId ||
      (Array.isArray(requestData?.participantIds) && requestData.participantIds.includes(userDocId));

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You do not have permission to send messages in this conversation' },
        { status: 403 }
      );
    }

    // Create the message in Firebase
    const messageData = {
      content: content || '',
  senderId: userDocId,
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
