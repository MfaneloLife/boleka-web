import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { OrderService } from '@/src/lib/order-service';

/**
 * POST /api/orders/release
 * Release a frozen payout (changes status from FROZEN to PAID)
 * Only the vendor who froze it or an admin can release
 */
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

    // Verify the user is the vendor of this order
    const order = await OrderService.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.vendorId !== userId) {
      return NextResponse.json({ error: 'Forbidden: Only the vendor can release this order payout' }, { status: 403 });
    }

    await OrderService.releaseOrderPayout(orderId);

    return NextResponse.json({ 
      success: true, 
      message: 'Order payout has been released' 
    });
  } catch (error) {
    console.error('RELEASE_PAYOUT_ERROR', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to release order payout' 
    }, { status: 500 });
  }
}
