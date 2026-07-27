import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/requests/[requestId]/generate-qr
 *
 * Renter generates a 120-second expiring QR code for the vendor to scan.
 * The request must be in SUCCESSFUL status (settlement completed).
 * Only the renter (requester) may generate the QR.
 *
 * The vendor scans this QR via /api/requests/[requestId]/scan-qr to
 * mark the booking as COMPLETED.
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

  const requestRecord = await prisma.request.findUnique({
    where: { id: requestId },
    include: { item: { select: { userId: true } } },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  // Only the renter (requester) may generate the QR
  if (userId !== requestRecord.requesterId) {
    return NextResponse.json(
      { error: 'Only the renter can generate a completion QR code' },
      { status: 403 }
    );
  }

  // Must be in SUCCESSFUL status (settlement done)
  if (requestRecord.status !== 'SUCCESSFUL') {
    return NextResponse.json(
      {
        error: `Cannot generate QR for a request with status "${requestRecord.status}". Settlement must be completed first.`,
      },
      { status: 409 }
    );
  }

  // Generate QR data with 120-second expiry
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 120 * 1000);

  const qrData = JSON.stringify({
    requestId,
    renterId: userId,
    vendorId: requestRecord.ownerId,
    timestamp: now.getTime(),
    expiresAt: expiresAt.getTime(),
  });

  // Persist QR to the request
  await prisma.request.update({
    where: { id: requestId },
    data: {
      qrCode: qrData,
      qrCodeExpiresAt: expiresAt,
    },
  });

  return NextResponse.json({
    success: true,
    qrData,
    expiresAt: expiresAt.toISOString(),
    expiresIn: 120,
  });
}