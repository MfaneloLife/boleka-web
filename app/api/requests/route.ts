import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/src/lib/firebase-admin';

// Helper to verify Firebase ID token and resolve user doc
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

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthedUser(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'sent' or 'received'
    // We ignore provided emails for security, we derive from token instead

    const userId = auth.userId;
    const userEmail = auth.email;

    const requestsRef = adminDb.collection('requests');

    // Build queries to support both legacy email-based fields and new id-based fields
    let querySnaps: FirebaseFirestore.QuerySnapshot[] = [];
    if (type === 'sent') {
      const [byId, byEmail] = await Promise.all([
        requestsRef.where('requesterId', '==', userId).get(),
        requestsRef.where('requesterEmail', '==', userEmail).get(),
      ]);
      querySnaps = [byId, byEmail];
    } else if (type === 'received') {
      const [byId, byEmail] = await Promise.all([
        requestsRef.where('ownerId', '==', userId).get(),
        requestsRef.where('ownerEmail', '==', userEmail).get(),
      ]);
      querySnaps = [byId, byEmail];
    } else {
      // Default: return all involving the user
      const [ownerById, requesterById, ownerByEmail, requesterByEmail] = await Promise.all([
        requestsRef.where('ownerId', '==', userId).get(),
        requestsRef.where('requesterId', '==', userId).get(),
        requestsRef.where('ownerEmail', '==', userEmail).get(),
        requestsRef.where('requesterEmail', '==', userEmail).get(),
      ]);
      querySnaps = [ownerById, requesterById, ownerByEmail, requesterByEmail];
    }

    // Merge unique docs by id
    const seen = new Set<string>();
    const docs = querySnaps.flatMap(s => s.docs).filter(d => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    // Map to JSON
    const requests = docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => {
        const aTime = (a.updatedAt?.toDate ? a.updatedAt.toDate() : a.updatedAt) || (a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt) || 0;
        const bTime = (b.updatedAt?.toDate ? b.updatedAt.toDate() : b.updatedAt) || (b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt) || 0;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthedUser(request);
    if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { itemId, message } = body as { itemId?: string; message?: string };
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
    }

    // Fetch item to determine owner
    const itemDoc = await adminDb.collection('items').doc(String(itemId)).get();
    if (!itemDoc.exists) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    const item = itemDoc.data() as any;

    // Resolve owner user document
    let ownerId = item?.ownerId as string | undefined;
    let ownerData: any = null;
    if (ownerId) {
      const ownerDoc = await adminDb.collection('users').doc(String(ownerId)).get();
      if (ownerDoc.exists) {
        ownerData = ownerDoc.data();
      }
    } else if (item?.ownerEmail) {
      const ownerSnap = await adminDb.collection('users').where('email', '==', item.ownerEmail).limit(1).get();
      if (!ownerSnap.empty) {
        const ownerDoc = ownerSnap.docs[0];
        ownerId = ownerDoc.id;
        ownerData = ownerDoc.data();
      }
    }

    if (!ownerId) {
      return NextResponse.json({ error: 'Item owner not found' }, { status: 400 });
    }

    const requesterId = auth.userId;
    const requesterEmail = auth.email;
    const requesterData = auth.user as any;

    const now = new Date();
    const newRequest = {
      itemId: String(itemId),
      itemTitle: item?.title || '',
      itemDescription: item?.description || '',
      itemPrice: item?.price ?? 0,
      itemImageUrls: item?.imageUrls || [],
      itemLocation: item?.location || '',
      itemCategory: item?.category || '',
      ownerId,
      ownerEmail: ownerData?.email || null,
      ownerName: ownerData?.name || 'Owner',
      requesterId,
      requesterEmail,
      requesterName: requesterData?.name || 'User',
      status: 'pending',
      participantIds: [ownerId, requesterId],
      createdAt: now,
      updatedAt: now,
    };

    const reqRef = await adminDb.collection('requests').add(newRequest);

    // Optionally create first message
    if (message && String(message).trim().length > 0) {
      await adminDb.collection('messages').add({
        content: String(message).trim(),
        senderId: requesterId,
        senderName: requesterData?.name || 'User',
        senderImage: requesterData?.image || null,
        requestId: reqRef.id,
        createdAt: now,
      });
    }

    return NextResponse.json({ id: reqRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}