import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/src/lib/order-service';
import { OrderStatus } from '@/src/types/order';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { qrData, vendorId } = body;

    if (!qrData) {
      return NextResponse.json({ error: 'QR data is required' }, { status: 400 });
    }

    const orderService = new OrderService();

    try {
      // Parse QR data - should contain order ID and timestamp
      const qrDataParsed = JSON.parse(qrData);
      const { orderId, timestamp, amount } = qrDataParsed;

      if (!orderId || !timestamp) {
        return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 });
      }

      // Check if QR code is expired (120 seconds)
      const now = Date.now();
      const qrAge = now - timestamp;
      const maxAge = 120 * 1000; // 120 seconds in milliseconds

      if (qrAge > maxAge) {
        return NextResponse.json({ error: 'QR code has expired' }, { status: 400 });
      }

      // Get the order
      const order = await OrderService.getOrder(orderId);
      
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Verify vendor authorization
      if (order.vendorId !== vendorId && order.vendorId !== session.user.email) {
        return NextResponse.json({ error: 'Unauthorized for this order' }, { status: 403 });
      }

      // Check if order is in the correct status for QR scanning
      if (order.status !== OrderStatus.CASH_PAYMENT) {
        return NextResponse.json({ 
          error: 'Order is not awaiting cash payment confirmation' 
        }, { status: 400 });
      }

      // Update order status to payment received using completeOrderWithQR
      await OrderService.completeOrderWithQR(
        qrData, 
        session.user.email
      );

      // Get updated order
      const updatedOrder = await OrderService.getOrder(orderId);

      return NextResponse.json({
        success: true,
        orderId: orderId,
        message: 'Payment confirmed successfully',
        order: updatedOrder
      });

    } catch (parseError) {
      // If QR data is not JSON, treat as plain text order ID
      const orderId = qrData.trim();
      
      const order = await OrderService.getOrder(orderId);
      
      if (!order) {
        return NextResponse.json({ error: 'Invalid QR code or order not found' }, { status: 404 });
      }

      // Verify vendor authorization
      if (order.vendorId !== vendorId && order.vendorId !== session.user.email) {
        return NextResponse.json({ error: 'Unauthorized for this order' }, { status: 403 });
      }

      // Simple order lookup without timestamp validation
      return NextResponse.json({
        success: true,
        orderId: orderId,
        order: order,
        message: 'Order found'
      });
    }

  } catch (error) {
    console.error('QR scan error:', error);
    return NextResponse.json(
      { error: 'Failed to process QR code' },
      { status: 500 }
    );
  }
}