import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { OrderService } from '@/src/lib/order-service';

/**
 * POST /api/orders/freeze
 * Freeze a vendor's payout for an order (changes status from PAID to FROZEN)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, reason } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({ error: 'A detailed reason is required (min 10 characters)' }, { status: 400 });
    }

    // Verify the user is the vendor of this order
    const order = await OrderService.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.vendorId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden: Only the vendor can freeze this order payout' }, { status: 403 });
    }

    await OrderService.freezeOrderPayout(orderId, reason);

    return NextResponse.json({ 
      success: true, 
      message: 'Order payout has been frozen' 
    });
  } catch (error) {
    console.error('FREEZE_PAYOUT_ERROR', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to freeze order payout' 
    }, { status: 500 });
  }
}
