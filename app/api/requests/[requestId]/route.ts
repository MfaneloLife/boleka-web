import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/src/lib/firebase-admin';

async function getAuthedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring('Bearer '.length)
    : undefined;
  if (!token) return { error: 'Missing Authorization token', status: 401 } as const;
  const decoded = await adminAuth.verifyIdToken(token);
  const email = decoded.email;
  if (!email) return { error: 'Invalid token: missing email', status: 401 } as const;
  const usersSnap = await adminDb.collection('users').where('email', '==', email).limit(1).get();
  if (usersSnap.empty) return { error: 'User not found', status: 404 } as const;
  const userDoc = usersSnap.docs[0];
  return { userId: userDoc.id, email, user: userDoc.data() } as const;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const auth = await getAuthedUser(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const requestDoc = await adminDb.collection('requests').doc(params.requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = requestDoc.data() as any;
    
    // Check if user is authorized to view this request
    const isOwner = requestData.ownerId === auth.userId || requestData.ownerEmail === auth.email;
    const isRequester = requestData.requesterId === auth.userId || requestData.requesterEmail === auth.email;
    if (!isOwner && !isRequester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      id: requestDoc.id,
      ...requestData
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const auth = await getAuthedUser(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    
    // Get the current request to check authorization
    const requestDoc = await adminDb.collection('requests').doc(params.requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const requestData = requestDoc.data() as any;
    
    // Check if user is authorized to update this request
    // Owner can approve/decline, requester can cancel
    const isOwner = requestData.ownerId === auth.userId || requestData.ownerEmail === auth.email;
    const isRequester = requestData.requesterId === auth.userId || requestData.requesterEmail === auth.email;
    if (!isOwner && !isRequester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate status transitions
    const currentStatus = requestData.status;
    const newStatus = body.status;
    
    if (newStatus && !isValidStatusTransition(currentStatus, newStatus, auth.email, requestData)) {
      return NextResponse.json({ 
        error: 'Invalid status transition' 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      ...body,
      updatedAt: new Date()
    };

    // Update the request
    await adminDb.collection('requests').doc(params.requestId).update(updateData);

    // Get updated request
    const updatedDoc = await adminDb.collection('requests').doc(params.requestId).get();
    
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (error) {
    console.error('Error updating request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

function isValidStatusTransition(
  currentStatus: string, 
  newStatus: string, 
  userEmail: string, 
  requestData: any
): boolean {
  // Owner can approve or decline pending requests
  if (userEmail === requestData.ownerEmail) {
    if (currentStatus === 'pending' && (newStatus === 'accepted' || newStatus === 'rejected')) {
      return true;
    }
    // Owner can mark completed requests as paid
    if (currentStatus === 'completed' && newStatus === 'paid') {
      return true;
    }
  }
  
  // Requester can cancel their own pending requests
  if (userEmail === requestData.requesterEmail) {
    if (currentStatus === 'pending' && newStatus === 'cancelled') {
      return true;
    }
    // Requester can mark accepted requests as completed
    if (currentStatus === 'accepted' && newStatus === 'completed') {
      return true;
    }
  }
  
  // System updates (like linking orders)
  if (newStatus === currentStatus) {
    return true; // Allow updates to same status (for additional fields)
  }
  
  return false;
}