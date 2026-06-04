import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { OrderService } from '@/src/lib/order-service';

/**
 * POST /api/orders/generate-return-qr
 * Vendor generates a return QR code for the buyer to scan.
 * The buyer scans this QR to mark the item as returned.
 * Flow: COMPLETED → (buyer scans return QR) → RETURNED
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

    const result = await OrderService.generateReturnQR(orderId, userId);

    return NextResponse.json({
      success: true,
      qrData: result.qrData,
      expiresAt: result.expiresAt.toISOString(),
      expiresIn: 120 // seconds
    });
  } catch (error) {
    console.error('GENERATE_RETURN_QR_ERROR', error);
    
    const message = error instanceof Error ? error.message : 'Failed to generate return QR code';
    
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('COMPLETED') || message.includes('already been returned')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}