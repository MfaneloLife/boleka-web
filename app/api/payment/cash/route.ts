import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { OrderService } from '@/src/lib/order-service';
import { createPaymentRecord, getRequestById } from '@/lib/neon-db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
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

    if (order.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestData = await getRequestById(order.requestId);
    if (!requestData) {
      return NextResponse.json({ error: 'Request not found for this order' }, { status: 404 });
    }

    const totalAmount = Number(order.totalAmount || 0);
    const payment = await createPaymentRecord({
      requestId: order.requestId,
      amount: totalAmount,
      payerId: order.userId,
      method: 'CASH',
    });

    await OrderService.markPaymentReceived(
      orderId,
      payment.id,
      'Cash payment confirmed',
      totalAmount,
      order.userId
    );

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (error) {
    console.error('CASH_PAYMENT_ERROR', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
