import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/orders/return
 * Mark a rented item as returned by the renter.
 * This is the final step in the rental lifecycle:
 * PAID → (QR scan) → COMPLETED → (return) → RETURNED
 * Only the vendor can mark an item as returned.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Fetch the booking with item to verify vendor
    const booking = await prisma.booking.findUnique({
      where: { id: orderId },
      include: { item: true }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only the vendor can mark as returned
    if (booking.item.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden: Only the vendor can mark item as returned' }, { status: 403 });
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Order must be in COMPLETED status to mark as returned' }, { status: 400 });
    }

    if (booking.returnStatus === 'RETURNED') {
      return NextResponse.json({ error: 'Item has already been returned' }, { status: 400 });
    }

    const now = new Date();

    await prisma.booking.update({
      where: { id: orderId },
      data: {
        returnStatus: 'RETURNED',
        returnedAt: now,
        notes: booking.notes 
          ? `${booking.notes} | Item returned at ${now.toISOString()}`
          : `Item returned at ${now.toISOString()}`
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Item marked as returned successfully',
      returnedAt: now.toISOString()
    });
  } catch (error) {
    console.error('RETURN_ITEM_ERROR', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to mark item as returned' 
    }, { status: 500 });
  }
}
