import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FirebaseDbService } from '@/src/lib/firebase-db';

// Marks a payment as paid out to the merchant (idempotent)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    // Load payment to check ownership
    const payments = await FirebaseDbService.getPaymentsByMerchant('dummy');
    // The above doesn't fetch arbitrary payment by id; add a lightweight get by id using admin
    // Workaround: Temporary query
    // @ts-ignore
    const adminDb = (await import('@/src/lib/firebase-admin')).adminDb;
    const doc = await adminDb.collection('payments').doc(paymentId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    const payment = { id: doc.id, ...doc.data() } as any;

    // Only allow the merchant who owns this payment or an admin to settle
    const userRes = await FirebaseDbService.getUserByEmail(session.user.email);
    if (!userRes.success || !userRes.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const isOwner = payment.merchantId === userRes.user.id;
    const isAdmin = session.user.email?.endsWith('@boleka.admin');
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await FirebaseDbService.updatePayment(paymentId, {
      merchantPaid: true,
      merchantPayoutDate: new Date(),
      status: 'PAID',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settle payout error:', error);
    return NextResponse.json({ error: 'Failed to settle payout' }, { status: 500 });
  }
}
