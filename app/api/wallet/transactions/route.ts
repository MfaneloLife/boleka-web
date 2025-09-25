import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { adminAuth } from '@/src/lib/firebase-admin';
import { FirebaseDbService } from '@/src/lib/firebase-db';

// GET /api/wallet/transactions?limit=100
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(limitParam, 1), 200);

    const authHeader = request.headers.get('authorization');
    let userEmail: string | null = null; let firebaseUid: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      try { const decoded = await adminAuth.verifyIdToken(authHeader.substring(7)); userEmail = decoded.email ?? null; firebaseUid = decoded.uid ?? null; } catch {}
    }
    if (!userEmail) { const headerEmail = request.headers.get('x-user-email'); if (headerEmail) userEmail = headerEmail; }
    if (!userEmail) { const session = await getServerSession(authOptions); if (session?.user?.email) userEmail = session.user.email; }
    if (!userEmail && !firebaseUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let userResult; if (userEmail) userResult = await FirebaseDbService.getUserByEmail(userEmail);
    if ((!userResult || !userResult.success || !userResult.user) && firebaseUid) userResult = await FirebaseDbService.getUserByFirebaseUid(firebaseUid!);
    if (!userResult?.success || !userResult.user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const txRes = await FirebaseDbService.listWalletTransactions(userResult.user.id, limit);
    if (!txRes.success) return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });

    return NextResponse.json({ success: true, transactions: txRes.transactions });
  } catch (error) {
    console.error('Wallet transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet transactions' }, { status: 500 });
  }
}
