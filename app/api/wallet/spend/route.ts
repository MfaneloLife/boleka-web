import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { adminAuth } from '@/src/lib/firebase-admin';
import { FirebaseDbService } from '@/src/lib/firebase-db';
import { adminDb } from '@/src/lib/firebase-admin';
const CURRENCY = 'ZAR';

/**
 * POST /api/wallet/spend
 * Body: { amount: number, purpose: string, orderId?: string, requestId?: string }
 * Deducts from available wallet (via DEBIT_SPEND). No concurrency lock yet (future improvement: Firestore transaction).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let userEmail: string | null = null; let firebaseUid: string | null = null;
    if (authHeader?.startsWith('Bearer ')) { try { const decoded = await adminAuth.verifyIdToken(authHeader.substring(7)); userEmail = decoded.email ?? null; firebaseUid = decoded.uid ?? null; } catch {} }
    if (!userEmail) { const session = await getServerSession(authOptions); if (session?.user?.email) userEmail = session.user.email; }
    if (!userEmail && !firebaseUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    let userResult; if (userEmail) userResult = await FirebaseDbService.getUserByEmail(userEmail); if ((!userResult || !userResult.success || !userResult.user) && firebaseUid) userResult = await FirebaseDbService.getUserByFirebaseUid(firebaseUid!); if (!userResult?.success || !userResult.user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const userId = userResult.user.id;

    const body = await request.json().catch(() => null);
    if (!body?.amount || body.amount <= 0) return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
    const { amount, purpose, orderId, requestId } = body as { amount: number; purpose?: string; orderId?: string; requestId?: string };

    const outcome = await adminDb.runTransaction(async (tx) => {
      // Recompute balance inside transaction
      const txSnap = await tx.get(adminDb.collection('walletTransactions').where('userId', '==', userId));
      let available = 0;
      txSnap.forEach(doc => {
        const d = doc.data() as any;
        const amt = d.amount || 0;
        switch (d.type) {
          case 'CREDIT_EARNED':
          case 'REFUND_CREDIT':
          case 'ADJUSTMENT_CREDIT':
            available += amt; break;
          case 'DEBIT_PAYOUT':
          case 'DEBIT_SPEND':
          case 'ADJUSTMENT_DEBIT':
            available -= amt; break;
        }
      });
      if (available < amount) {
        return { success: false, error: 'Insufficient wallet balance', available };
      }
      const now = new Date();
      const ledgerRef = adminDb.collection('walletTransactions').doc();
      tx.set(ledgerRef, {
        userId,
        type: 'DEBIT_SPEND',
        amount,
        currency: CURRENCY,
        relatedOrderId: orderId,
        relatedRequestId: requestId,
        metadata: { purpose },
        createdAt: now,
        updatedAt: now
      });
      // Optional status audit for order linkage if spending tied to an order (e.g., internal consumption)
      if (orderId) {
        const statusRef = adminDb.collection('orderStatusUpdates').doc();
        tx.set(statusRef, { orderId, status: 'wallet_spend', notes: purpose || 'Wallet spend', updatedBy: userId, timestamp: now });
      }
      return { success: true, remaining: available - amount };
    });

    if (!outcome.success) return NextResponse.json({ error: outcome.error }, { status: 400 });
    return NextResponse.json({ success: true, spent: amount, remaining: outcome.remaining });
  } catch (error) {
    console.error('Wallet spend error:', error);
    return NextResponse.json({ error: 'Failed to spend wallet funds' }, { status: 500 });
  }
}
