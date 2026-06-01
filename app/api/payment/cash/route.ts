import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/payment/cash
 * Body: { requestId: string, amount: number }
 *
 * Marks a Request as paid with cash method.
 * Creates a Payment record and decrements item quantity.
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

    // Create the Payment record
    const payment = await prisma.payment.create({
      data: {
        requestId: requestRecord.id,
        payerId: userId,
        amount: Number(amount),
        status: 'PAID',
        method: 'CASH',
      },
    });

    // Update Request status to PAID
    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'PAID' },
    });

    // Decrement item quantity
    if (requestRecord.item && requestRecord.item.quantity > 0) {
      await prisma.item.update({
        where: { id: requestRecord.item.id },
        data: { quantity: { decrement: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      requestId: requestRecord.id,
      status: 'PAID',
    });
  } catch (error) {
    console.error('CASH_PAYMENT_ERROR', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}