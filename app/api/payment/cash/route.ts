import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { OrderService } from '@/src/lib/order-service';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
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

    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const totalAmount = Number(order.totalAmount || 0);

    await OrderService.markPaymentReceived(
      orderId,
      orderId,
      'Cash payment confirmed',
      totalAmount,
      order.userId
    );

    return NextResponse.json({ success: true, paymentId: orderId });
  } catch (error) {
    console.error('CASH_PAYMENT_ERROR', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
