import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/src/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FirebaseDbService } from '@/src/lib/firebase-db';

export async function GET(request: NextRequest) {
  try {
    // Multi-strategy auth: Firebase Bearer token -> session -> explicit header (deprecated)
    const authHeader = request.headers.get('authorization');
    let email: string | null = null; let firebaseUid: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
        email = decoded.email ?? null;
        firebaseUid = decoded.uid ?? null;
      } catch (e) {
        // ignore and fall back
      }
    }
    if (!email) {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) email = session.user.email;
    }
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve user via service for consistency (ensures we get user.id)
    const userRes = await FirebaseDbService.getUserByEmail(email);
    if (!userRes.success || !userRes.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = userRes.user.id;

    // Fetch business profile
    const bpSnap = await adminDb.collection('businessProfiles')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    if (bpSnap.empty) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }
    const bpDoc = bpSnap.docs[0];
    const profile = { id: bpDoc.id, ...bpDoc.data() };
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json({
      error: 'Failed to fetch business profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
