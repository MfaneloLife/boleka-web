import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { adminAuth } from '@/src/lib/firebase-admin';
import { FirebaseDbService } from '@/src/lib/firebase-db';
import { adminDb } from '@/src/lib/firebase-admin';
import { OrderStatus } from '@/src/types/order';

/**
 * POST /api/wallet/pay
 * Body: { orderId: string }
 * Secure wallet payment:
 *  - Derives authoritative amounts from order (never trusts client amount)
 *  - Debits payer totalAmount (subtotal + platform fee)
 *  - Credits vendor subtotal (platform fee retained by platform)
 *  - (Optional) Leaves platform fee unapplied or could record a platform ledger entry in future
 *  - Idempotent: if order already marked paid OR existing DEBIT_SPEND for order exists, returns success quickly
 *  - Records status update document for audit
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    let userEmail: string | null = null; let firebaseUid: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
        userEmail = decoded.email ?? null; firebaseUid = decoded.uid ?? null;
      } catch {/* ignore invalid token */}
    }
    // Remove insecure x-user-email bypass: rely only on token or session
    if (!userEmail) {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) userEmail = session.user.email;
    }
    if (!userEmail && !firebaseUid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let userResult; if (userEmail) userResult = await FirebaseDbService.getUserByEmail(userEmail);
    if ((!userResult || !userResult.success || !userResult.user) && firebaseUid) userResult = await FirebaseDbService.getUserByFirebaseUid(firebaseUid!);
    if (!userResult?.success || !userResult.user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const payerUser = userResult.user;

  const body = await request.json().catch(() => null);
  if (!body?.orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });
  const { orderId } = body as { orderId: string };

    // Load order doc (if exists) to find vendor & verify not already paid
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const orderData = orderSnap.data() as any;
    if ([OrderStatus.PAYMENT_RECEIVED, OrderStatus.COMPLETED].includes(orderData.status)) {
      return NextResponse.json({ success: true, message: 'Order already paid' });
    }
    const vendorId = orderData.vendorId;
    if (!vendorId) return NextResponse.json({ error: 'Order missing vendorId' }, { status: 400 });
    // Ensure payer owns the order
    if (orderData.userId !== payerUser.id) {
      return NextResponse.json({ error: 'Cannot pay for an order you do not own' }, { status: 403 });
    }

    const orderSubtotal = orderData.subtotal;
    const orderPlatformFee = orderData.platformFee || 0;
    const orderTotal = orderData.totalAmount ?? (orderSubtotal + orderPlatformFee);

    // Idempotency: check for existing debit spend for this order & user
    const existingDebitSnap = await adminDb.collection('walletTransactions')
      .where('userId', '==', payerUser.id)
      .where('type', '==', 'DEBIT_SPEND')
      .where('relatedOrderId', '==', orderId)
      .limit(1)
      .get();
    if (!existingDebitSnap.empty) {
      // Mark order if still not updated (edge case)
      if (orderData.status !== OrderStatus.PAYMENT_RECEIVED) {
        await orderRef.update({ status: OrderStatus.PAYMENT_RECEIVED, updatedAt: new Date() });
      }
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // Transaction: verify balance, create ledger entries for payer (debit total) & vendor (credit subtotal), update order
  const result = await adminDb.runTransaction(async (tx) => {
      // Recompute payer balance
      const balSnap = await tx.get(adminDb.collection('walletTransactions').where('userId', '==', payerUser.id));
      let available = 0;
      balSnap.forEach(d => {
        const v = d.data() as any; const a = v.amount || 0;
        switch (v.type) {
          case 'CREDIT_EARNED':
          case 'REFUND_CREDIT':
          case 'ADJUSTMENT_CREDIT':
            available += a; break;
          case 'DEBIT_PAYOUT':
          case 'DEBIT_SPEND':
          case 'ADJUSTMENT_DEBIT':
            available -= a; break;
        }
      });
      if (available < orderTotal) return { error: 'Insufficient wallet balance' };

      const now = new Date();
      // Order update (use correct enum string value)
      tx.update(orderRef, { status: OrderStatus.PAYMENT_RECEIVED, updatedAt: now });
      // Status audit document
      const statusDoc = adminDb.collection('orderStatusUpdates').doc();
      tx.set(statusDoc, { orderId, status: OrderStatus.PAYMENT_RECEIVED, notes: 'Wallet payment', updatedBy: payerUser.id, timestamp: now });

      // Payer debit (total amount)
      const debitRef = adminDb.collection('walletTransactions').doc();
      tx.set(debitRef, {
        userId: payerUser.id,
        type: 'DEBIT_SPEND',
        amount: orderTotal,
        currency: 'ZAR',
        relatedOrderId: orderId,
        metadata: { method: 'WALLET', role: 'payer' },
        createdAt: now,
        updatedAt: now
      });
      // Vendor credit
      const creditRef = adminDb.collection('walletTransactions').doc();
      tx.set(creditRef, {
        userId: vendorId,
        type: 'CREDIT_EARNED',
        amount: orderSubtotal,
        currency: 'ZAR',
        relatedOrderId: orderId,
        metadata: { source: 'WALLET_PAYMENT', payer: payerUser.id, platformFee: orderPlatformFee },
        createdAt: now,
        updatedAt: now
      });
      // Optional platform fee capture ledger (internal user id 'platform') if fee > 0
      if (orderPlatformFee > 0) {
        const platformRef = adminDb.collection('walletTransactions').doc();
        tx.set(platformRef, {
          userId: 'platform',
          type: 'CREDIT_EARNED',
          amount: orderPlatformFee,
          currency: 'ZAR',
          relatedOrderId: orderId,
          metadata: { source: 'PLATFORM_FEE', payer: payerUser.id },
          createdAt: now,
          updatedAt: now
        });
      }
      return { success: true, remaining: available - orderTotal };
    });

    if ((result as any).error) return NextResponse.json({ error: (result as any).error }, { status: 400 });
    // Adjust remaining calculation if we changed variable
    if ((result as any).success) {
      // Recompute remaining correctly (fix earlier return calculation using amount variable)
      const remaining = (result as any).remaining ?? null;
      return NextResponse.json({ success: true, remaining });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Wallet pay error:', error);
    return NextResponse.json({ error: 'Failed wallet payment' }, { status: 500 });
  }
}
