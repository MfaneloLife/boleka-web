import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/requests/[requestId]/update-price
 *
 * Owner-only endpoint that updates the final agreed price (finalValue) on a
 * request/negotiation.  The owner must be the authenticated user, the request
 * must exist, and the status must be PENDING, ACCEPTED, or NEGOTIATING.
 *
 * Body: { finalValue: number }
 *
 * On success the request status is automatically promoted to NEGOTIATING
 * (if it was PENDING or ACCEPTED) so the renter sees a confirmed price to pay.
 */
export async function PATCH(
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

  // Parse and validate body
  let finalValue: number;
  try {
    const body = await request.json();
    finalValue = parseFloat(body.finalValue as string);
    if (isNaN(finalValue) || finalValue <= 0) {
      return NextResponse.json(
        { error: 'finalValue must be a positive number' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Fetch the request with its item & owner
  const requestRecord = await prisma.request.findUnique({
    where: { id: requestId },
    include: { item: { select: { userId: true } } },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  // Only the item owner may set/update the final price
  if (userId !== requestRecord.ownerId && userId !== requestRecord.item.userId) {
    return NextResponse.json({ error: 'Only the item owner can set the final price' }, { status: 403 });
  }

  // Only allow price updates while the negotiation is still open
  const allowedStatuses: string[] = ['PENDING', 'ACCEPTED', 'NEGOTIATING'];
  if (!allowedStatuses.includes(requestRecord.status)) {
    return NextResponse.json(
      { error: `Cannot update price when the request status is ${requestRecord.status}` },
      { status: 409 }
    );
  }

  // Promote status to NEGOTIATING if not already there or later
  const newStatus =
    requestRecord.status === 'PENDING' || requestRecord.status === 'ACCEPTED'
      ? 'NEGOTIATING'
      : requestRecord.status;

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      finalValue,
      status: newStatus,
    },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    finalValue: updated.finalValue,
    initialPrice: updated.totalPrice,
    updatedAt: updated.updatedAt.toISOString(),
  });
}