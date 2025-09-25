import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { adminAuth } from '@/src/lib/firebase-admin';
import { FirebaseDbService } from '@/src/lib/firebase-db';
import { adminDb } from '@/src/lib/firebase-admin';
import { OrderStatus } from '@/src/types/order';

/**
 * POST /api/wallet/payout
 * Body: { paymentIds?: string[] }
 * If paymentIds omitted, auto-select all completed & not yet merchantPaid payments.
 * Marks payments merchantPaid and records walletTransactions of type DEBIT_PAYOUT.
 */
export async function POST(request: NextRequest) {
  try {
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
    const userId = userResult.user.id;

    const businessProfile = await FirebaseDbService.getBusinessProfileByUserId(userId);
    if (!businessProfile.success || !businessProfile.profile) {
      return NextResponse.json({ error: 'Business profile required' }, { status: 400 });
    }
    const b = businessProfile.profile;
    if (!(b.bankName && b.accountNumber && b.accountType && b.branchCode && b.accountHolderName)) {
      return NextResponse.json({ error: 'Banking details incomplete' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { paymentIds } = body as { paymentIds?: string[] };

    // Fetch all eligible payments (completed & not merchantPaid)
    const paymentsRes = await FirebaseDbService.getPaymentsByMerchant(userId);
    if (!paymentsRes.success) return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    const allCompleted = (paymentsRes.payments || []).filter(p => ['COMPLETED','PAID'].includes(p.status));
    const eligible = allCompleted.filter(p => !p.merchantPaid);
    let target = eligible;
    if (paymentIds?.length) {
      const set = new Set(paymentIds);
      target = eligible.filter(p => set.has(p.id));
      if (!target.length) return NextResponse.json({ error: 'No eligible payments for provided IDs' }, { status: 400 });
    }
    if (!target.length) return NextResponse.json({ error: 'No funds available for payout' }, { status: 400 });

    // Firestore transaction to avoid race conditions
    const result = await adminDb.runTransaction(async (tx) => {
      let total = 0; const updatedIds: string[] = [];
      const now = new Date();
      for (const pay of target) {
        const payRef = adminDb.collection('payments').doc(pay.id);
        const snap = await tx.get(payRef);
        if (!snap.exists) continue;
        const current = snap.data() as any;
        if (current.merchantPaid) continue; // skip already paid in concurrent run
        // Mark paid
        tx.update(payRef, { merchantPaid: true, merchantPayoutDate: now, status: 'PAID', updatedAt: now });
        // Ledger entry
        const ledgerRef = adminDb.collection('walletTransactions').doc();
        tx.set(ledgerRef, {
          userId,
          type: 'DEBIT_PAYOUT',
          amount: pay.merchantAmount,
            currency: 'ZAR',
          relatedPaymentId: pay.id,
          relatedOrderId: pay.orderId,
          relatedRequestId: pay.requestId,
          metadata: { method: 'BANK_TRANSFER', bankName: b.bankName },
          createdAt: now,
          updatedAt: now
        });
        // Status audit on order (if order exists) for transparency
        if (pay.orderId) {
          const statusRef = adminDb.collection('orderStatusUpdates').doc();
          tx.set(statusRef, { orderId: pay.orderId, status: OrderStatus.PAYMENT_RECEIVED, notes: 'Merchant payout initiated', updatedBy: userId, timestamp: now });
        }
        total += pay.merchantAmount;
        updatedIds.push(pay.id);
      }
      return { total, updatedIds };
    });

    return NextResponse.json({ success: true, payoutAmount: result.total, paymentCount: result.updatedIds.length, payments: result.updatedIds });
  } catch (error) {
    console.error('Wallet payout error:', error);
    return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 });
  }
}
