import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/requests/[requestId]/settle
 *
 * Renter-only endpoint that finalizes a booking by choosing an offline
 * payment method (CASH or EFT).  The request must be in NEGOTIATING status
 * (owner has confirmed a final price) and the renter must be the authenticated
 * user.
 *
 * Body: { paymentMethod: 'CASH' | 'EFT' }
 *
 * On success:
 *  - Request status → SUCCESSFUL
 *  - paymentMethod is persisted
 *  - A Payment record is created (with the agreed finalValue)
 *  - The 10 % platform commission is captured for the audit trail
 *  - Returns a receipt-style payload with a unique Booking Reference ID
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { requestId } = params;
  if (!requestId) {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
  }

  // Parse body
  let paymentMethod: string;
  try {
    const body = await request.json();
    paymentMethod = String(body.paymentMethod ?? '').trim().toUpperCase();
    if (!['CASH', 'EFT'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'paymentMethod must be "CASH" or "EFT"' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Fetch the request
  const requestRecord = await prisma.request.findUnique({
    where: { id: requestId },
    include: { item: { select: { userId: true, title: true } } },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  // Only the renter (requester) may settle
  if (userId !== requestRecord.requesterId) {
    return NextResponse.json(
      { error: 'Only the renter can settle this booking' },
      { status: 403 }
    );
  }

  // Must be in NEGOTIATING state (owner has locked a final price)
  if (requestRecord.status !== 'NEGOTIATING') {
    return NextResponse.json(
      {
        error: `Cannot settle a request with status "${requestRecord.status}". The owner must confirm a final price first.`,
      },
      { status: 409 }
    );
  }

  // Require finalValue to be set
  const settledAmount = requestRecord.finalValue ?? requestRecord.totalPrice;
  if (!settledAmount || settledAmount <= 0) {
    return NextResponse.json(
      { error: 'No final price has been set for this request' },
      { status: 400 }
    );
  }

  // 10 % platform commission
  const platformCommission = Math.round(settledAmount * 0.1 * 100) / 100;

  // 90 % host payout
  const hostPayout = Math.round((settledAmount - platformCommission) * 100) / 100;

  // Execute settlement + wallet credit in a single transaction
  const [updatedRequest, payment] = await prisma.$transaction([
    prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'SUCCESSFUL',
        paymentMethod: paymentMethod as 'CASH' | 'EFT',
        finalValue: settledAmount,
      },
    }),
    prisma.payment.create({
      data: {
        requestId,
        payerId: userId,
        amount: settledAmount,
        method: paymentMethod,
        status: 'COMPLETED',
      },
    }),
  ]);

  // Credit the host's wallet atomically
  await prisma.wallet.upsert({
    where: { userId: requestRecord.ownerId },
    create: {
      userId: requestRecord.ownerId,
      availableBalance: hostPayout,
      pendingBalance: 0,
      totalSales: hostPayout,
      payoutStatus: 'AVAILABLE',
    },
    update: {
      availableBalance: { increment: hostPayout },
      totalSales: { increment: hostPayout },
    },
  });

  // Notify the host that payment was received
  try {
    await prisma.notification.create({
      data: {
        userId: requestRecord.ownerId,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment received',
        message: `R ${settledAmount.toFixed(2)} received for "${requestRecord.item.title}". Payout: R ${hostPayout.toFixed(2)}`,
        relatedId: requestId,
      },
    });
  } catch (notifErr) {
    console.error('Failed to create notification:', notifErr);
  }

  return NextResponse.json({
    receipt: {
      bookingReference: updatedRequest.id,
      status: updatedRequest.status,
      itemTitle: requestRecord.item.title,
      finalAmount: settledAmount,
      platformCommission,
      vendorPayout: hostPayout,
      paymentMethod: updatedRequest.paymentMethod,
      settledAt: updatedRequest.updatedAt.toISOString(),
    },
  });
}
