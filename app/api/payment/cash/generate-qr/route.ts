import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { OrderService } from '@/src/lib/order-service';

/**
 * POST /api/payment/cash/generate-qr
 * Body: { requestId: string }
 *
 * Generates a 120-second expiring QR code for the buyer to show to the vendor.
 * The vendor scans this QR to confirm they received the cash payment.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const result = await OrderService.generateCashPaymentQR(requestId, userId);

    return NextResponse.json({
      success: true,
      qrData: result.qrData,
      expiresAt: result.expiresAt.toISOString(),
      expiresIn: 120, // seconds
      message: 'Show this QR code to the vendor after paying cash.',
    });
  } catch (error) {
    console.error('CASH_QR_GENERATE_ERROR', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('CASH_PAYMENT_PENDING') || message.includes('status')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}