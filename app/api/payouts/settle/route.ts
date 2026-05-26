import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/payouts/settle
 * Settle a payout for a completed order.
 * This releases the vendor payout (95%) after platform commission (5%) is deducted.
 * Only the vendor or an admin can settle a payout.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { item: true }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify ownership
    const isOwner = booking.item.userId === session.userId;
    const isAdmin = session.userId?.endsWith('@boleka.admin');
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Only the vendor or admin can settle this payout' }, { status: 403 });
    }

    // Validate booking is in a settleable state
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Booking must be in COMPLETED status to settle payout' }, { status: 400 });
    }

    if (booking.returnStatus === 'NOT_RETURNED') {
      return NextResponse.json({ error: 'Item must be marked as returned before settling payout' }, { status: 400 });
    }

    const now = new Date();
    
    // Calculate payout split: 5% platform commission
    const platformCommission = booking.totalPrice * 0.05;
    const vendorPayoutAmount = booking.totalPrice - platformCommission;

    // Update booking with payout details
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        platformCommission,
        vendorPayoutAmount,
        commissionPaid: true,
        notes: booking.notes 
          ? `${booking.notes} | Payout settled at ${now.toISOString()} (Platform: R${platformCommission.toFixed(2)}, Vendor: R${vendorPayoutAmount.toFixed(2)})`
          : `Payout settled at ${now.toISOString()} (Platform: R${platformCommission.toFixed(2)}, Vendor: R${vendorPayoutAmount.toFixed(2)})`
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Payout settled successfully',
      payout: {
        totalAmount: booking.totalPrice,
        platformCommission,
        vendorPayoutAmount,
        settledAt: now.toISOString()
      }
    });
  } catch (error) {
    console.error('SETTLE_PAYOUT_ERROR', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to settle payout' 
    }, { status: 500 });
  }
}
