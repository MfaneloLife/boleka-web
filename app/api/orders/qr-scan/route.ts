import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { OrderService } from '@/src/lib/order-service';

/**
 * POST /api/orders/qr-scan
 * Unified QR scan endpoint:
 * - Completion QR: vendor scans renter's QR → PAID → COMPLETED (triggers payout split)
 * - Return QR: buyer scans vendor's return QR → COMPLETED → RETURNED
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

    // Cash payment confirmation QR codes use requestId instead of orderId
    if (qrData.action === 'cash_payment_confirm') {
      if (!qrData.requestId) {
        return NextResponse.json({ error: 'Invalid QR code: missing requestId' }, { status: 400 });
      }
      const result = await OrderService.confirmCashPaymentWithQR(qrCode, userId);

      return NextResponse.json({
        success: true,
        message: 'Cash payment confirmed. Booking created and item quantity decremented.',
        requestId: result.requestId,
        bookingId: result.bookingId,
        paymentId: result.paymentId,
        action: 'cash_payment_confirm'
      });
    }

    if (!qrData.orderId) {
      return NextResponse.json({ error: 'Invalid QR code: missing orderId' }, { status: 400 });
    }

    // Check if this is a return QR code
    if (qrData.action === 'return') {
      // Buyer scans vendor's return QR to mark item as returned
      await OrderService.completeReturnWithQR(qrCode, userId);

      return NextResponse.json({
        success: true,
        message: 'Item returned successfully via QR scan.',
        orderId: qrData.orderId,
        action: 'return'
      });
    }

    // Default: vendor scans renter's QR to complete the order
    await OrderService.completeOrderWithQR(qrCode, userId);

    return NextResponse.json({
      success: true,
      message: 'Order completed successfully. Payout split calculated (95% vendor / 5% platform).',
      orderId: qrData.orderId,
      action: 'complete'
    });
  } catch (error) {
    console.error('QR_SCAN_ERROR', error);
    
    const message = error instanceof Error ? error.message : 'Failed to process QR scan';
    
    if (message.includes('expired')) {
      return NextResponse.json({ error: message }, { status: 410 }); // Gone
    }
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('Invalid')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message.includes('not a return QR')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}