import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { OrderService } from '@/src/lib/order-service';

/**
 * POST /api/orders/generate-qr
 * Generate a 120-second expiring QR code for the renter to show to the vendor.
 * The vendor scans this QR to complete the order and trigger the payout.
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

    const result = await OrderService.generateQRCode(orderId, userId);

    return NextResponse.json({
      success: true,
      qrData: result.qrData,
      expiresAt: result.expiresAt.toISOString(),
      expiresIn: 120 // seconds
    });
  } catch (error) {
    console.error('GENERATE_QR_ERROR', error);
    
    const message = error instanceof Error ? error.message : 'Failed to generate QR code';
    
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes('payment')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
