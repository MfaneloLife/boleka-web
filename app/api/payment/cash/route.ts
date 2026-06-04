import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { decrementItemQuantity } from '@/src/lib/order-service';

/**
 * POST /api/payment/cash
 * Body: { requestId: string, amount: number }
 *
 * Marks a Request as paid with cash method.
 * Creates a Payment record, a Booking record (for return flow), and decrements item quantity.
 * Used when buyer and seller agree on cash payment in person.
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

    // Find the request
    const requestRecord = await prisma.request.findUnique({
      where: { id: requestId },
      include: { item: true },
    });

    if (!requestRecord) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Only the requester (buyer) can initiate cash payment
    if (requestRecord.requesterId !== userId) {
      return NextResponse.json({ error: 'Only the buyer can initiate cash payment' }, { status: 403 });
    }

    // Use a transaction to create Payment, Booking, and update Request atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create the Payment record
      const payment = await tx.payment.create({
        data: {
          requestId: requestRecord.id,
          payerId: userId,
          amount: Number(amount),
          status: 'PAID',
          method: 'CASH',
        },
      });

      // Update Request status to PAID
      await tx.request.update({
        where: { id: requestId },
        data: { status: 'PAID' },
      });

      // Create a Booking record for the return flow (buyer generates return QR, vendor scans)
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const booking = await tx.booking.create({
        data: {
          userId: requestRecord.requesterId,
          itemId: requestRecord.itemId,
          status: 'COMPLETED', // Start as COMPLETED so it's ready for return flow
          startDate: now,
          endDate,
          totalPrice: Number(amount),
          platformFee: 0,
          platformCommission: 0,
          vendorPayoutAmount: Number(amount),
          returnStatus: 'NOT_RETURNED',
          notes: `Cash payment for request #${requestRecord.id.slice(-8)} | Completed via cash on ${now.toISOString()}`,
        },
      });

      // Decrement item quantity
      if (requestRecord.item && requestRecord.item.quantity > 0) {
        await tx.item.update({
          where: { id: requestRecord.item.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      return { payment, booking };
    });

    return NextResponse.json({
      success: true,
      paymentId: result.payment.id,
      requestId: requestRecord.id,
      bookingId: result.booking.id,
      status: 'PAID',
      message: 'Cash payment recorded. Return flow is now available.',
    });
  } catch (error) {
    console.error('CASH_PAYMENT_ERROR', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}