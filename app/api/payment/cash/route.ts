import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/src/lib/order-service';
import { FirebaseDbService } from '@/src/lib/firebase-db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await OrderService.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only the order owner can confirm a cash payment here
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate amounts
    const totalAmount = Number(order.totalAmount || 0);
    const commissionAmount = Math.round(Number(order.platformFee || totalAmount * 0.08) * 100) / 100;
    const merchantAmount = Math.round((totalAmount - commissionAmount) * 100) / 100;

    // Create a Payment document for the cash transaction
    const createRes = await FirebaseDbService.createPayment({
      orderId,
      amount: totalAmount,
      commissionAmount,
      merchantAmount,
      merchantPaid: false,
      status: 'COMPLETED',
      transactionId: `cash_${Date.now()}`,
      paymentMethod: 'CASH',
      paymentDetails: JSON.stringify({ method: 'CASH', orderId }),
      payerId: order.userId,
      merchantId: order.vendorId,
    });

    if (!createRes.success || !createRes.id) {
      return NextResponse.json({ error: 'Failed to create cash payment record' }, { status: 500 });
    }

    // Mark order as payment received using the Payment doc id
    await OrderService.markPaymentReceived(
      orderId,
      createRes.id,
      'Cash payment confirmed',
      totalAmount,
      order.userId
    );

    return NextResponse.json({ success: true, paymentId: createRes.id });
  } catch (error) {
    console.error('CASH_PAYMENT_ERROR', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
