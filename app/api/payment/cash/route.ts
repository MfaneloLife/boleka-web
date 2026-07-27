import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { OrderService } from '@/src/lib/order-service';

/**
 * POST /api/payment/cash
 * Body: { requestId: string, amount: number }
 *
 * Initiates a pending cash payment. Instead of immediately marking as PAID,
 * this sets the Request to CASH_PAYMENT_PENDING and creates a Payment with
 * status PENDING. The buyer then generates a QR code and shows it to the vendor,
 * who scans it to confirm cash receipt.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId, amount } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const result = await OrderService.initiateCashPayment(requestId, userId, Number(amount));

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      requestId,
      status: 'CASH_PAYMENT_PENDING',
      message: 'Cash payment initiated. Generate a QR code and show it to the vendor to confirm payment.',
    });
  } catch (error) {
    console.error('CASH_PAYMENT_INITIATE_ERROR', error);
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('Unauthorized') || message.includes('Only the buyer')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}