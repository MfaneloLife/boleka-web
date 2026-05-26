import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { OrderService } from '@/src/lib/order-service';

/**
 * POST /api/orders/qr-scan
 * Vendor scans the renter's QR code to complete the order
 * This triggers: PAID → COMPLETED status change
 * and initiates the payout split (5% platform commission)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { qrCode } = await request.json();
    if (!qrCode) {
      return NextResponse.json({ error: 'qrCode is required' }, { status: 400 });
    }

    // Parse and validate QR code data
    let qrData: any;
    try {
      qrData = JSON.parse(qrCode);
    } catch {
      return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 });
    }

    if (!qrData.orderId) {
      return NextResponse.json({ error: 'Invalid QR code: missing orderId' }, { status: 400 });
    }

    // Complete the order using QR code scan
    await OrderService.completeOrderWithQR(qrCode, userId);

    return NextResponse.json({
      success: true,
      message: 'Order completed successfully. Payout split calculated (95% vendor / 5% platform).',
      orderId: qrData.orderId
    });
  } catch (error) {
    console.error('QR_SCAN_ERROR', error);
    
    const message = error instanceof Error ? error.message : 'Failed to complete order via QR scan';
    
    // Map common errors to appropriate status codes
    if (message.includes('expired')) {
      return NextResponse.json({ error: message }, { status: 410 }); // Gone
    }
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('Unauthorized') || message.includes('vendor')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('Invalid')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
