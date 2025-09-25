import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { adminAuth } from '@/src/lib/firebase-admin';
import { FirebaseDbService } from '@/src/lib/firebase-db';
import { OrderStatus } from '@/src/types/order';
import { adminDb } from '@/src/lib/firebase-admin';

/**
 * POST /api/wallet/refund
 * Body: { paymentId: string, reason?: string }
 * Marks payment status CANCELLED (if still pending) and credits payer wallet via REFUND_CREDIT.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let userEmail: string | null = null; let firebaseUid: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      try { const decoded = await adminAuth.verifyIdToken(authHeader.substring(7)); userEmail = decoded.email ?? null; firebaseUid = decoded.uid ?? null; } catch {}
    }
    if (!userEmail) { const session = await getServerSession(authOptions); if (session?.user?.email) userEmail = session.user.email; }
    if (!userEmail && !firebaseUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body?.paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 });
    const { paymentId, reason } = body as { paymentId: string; reason?: string };

    const result = await adminDb.runTransaction(async (tx) => {
      const payRef = adminDb.collection('payments').doc(paymentId);
      const snap = await tx.get(payRef);
      if (!snap.exists) return { error: 'Payment not found' };
      const payment = { id: snap.id, ...snap.data() } as any;
      if (payment.merchantPaid) return { error: 'Cannot refund after merchant payout' };
      if (payment.status === 'REFUNDED') {
        return { refundedAmount: payment.amount, paymentId: payment.id, already: true };
      }
      // Check existing refund ledger to enforce idempotency even if status not updated yet
      const existingRefund = await adminDb.collection('walletTransactions')
        .where('userId','==', payment.payerId)
        .where('type','==','REFUND_CREDIT')
        .where('relatedPaymentId','==', payment.id)
        .limit(1)
        .get();
      if (!existingRefund.empty) {
        // Align payment doc if missed
        if (payment.status !== 'REFUNDED') {
          tx.update(payRef, { status: 'REFUNDED', updatedAt: new Date() });
        }
        return { refundedAmount: payment.amount, paymentId: payment.id, already: true };
      }
      const now = new Date();
      // Mark payment refunded (distinct from CANCELLED so we know ledger state)
      tx.update(payRef, { status: 'REFUNDED', updatedAt: now });
      // Insert ledger credit
      const ledgerRef = adminDb.collection('walletTransactions').doc();
      tx.set(ledgerRef, {
        userId: payment.payerId,
        type: 'REFUND_CREDIT',
        amount: payment.amount,
        currency: 'ZAR',
        relatedPaymentId: payment.id,
        relatedOrderId: payment.orderId,
        relatedRequestId: payment.requestId,
        metadata: { reason: reason || 'Refund issued' },
        createdAt: now,
        updatedAt: now
      });
      // Status audit for order if present
      if (payment.orderId) {
        const statusRef = adminDb.collection('orderStatusUpdates').doc();
        tx.set(statusRef, { orderId: payment.orderId, status: 'REFUNDED', notes: reason || 'Refund issued', updatedBy: userEmail || firebaseUid, timestamp: now });
      }
      return { refundedAmount: payment.amount, paymentId: payment.id };
    });

    if ((result as any).error) return NextResponse.json({ error: (result as any).error }, { status: 400 });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}
