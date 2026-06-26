import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/requests/[requestId]/generate-return-qr
 *
 * Vendor generates a 120-second expiring return QR code for the renter to scan.
 * The request must be in COMPLETED status and not yet returned.
 * Only the vendor (owner) may generate the return QR.
 *
 * The renter scans this QR via /api/requests/[requestId]/scan-qr to
 * mark the item as RETURNED.
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

  // Only the vendor (owner) may generate the return QR
  if (userId !== requestRecord.ownerId) {
    return NextResponse.json(
      { error: 'Only the vendor can generate a return QR code' },
      { status: 403 }
    );
  }

  // Must be COMPLETED to generate return QR
  if (requestRecord.status !== 'COMPLETED') {
    return NextResponse.json(
      {
        error: `Cannot generate return QR for a request with status "${requestRecord.status}". The booking must be COMPLETED first.`,
      },
      { status: 409 }
    );
  }

  // Cannot return twice
  if (requestRecord.returnStatus === 'RETURNED') {
    return NextResponse.json(
      { error: 'Item has already been returned' },
      { status: 409 }
    );
  }

  // Generate return QR data with 120-second expiry
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 120 * 1000);

  const qrData = JSON.stringify({
    requestId,
    action: 'return',
    vendorId: userId,
    renterId: requestRecord.requesterId,
    timestamp: now.getTime(),
    expiresAt: expiresAt.getTime(),
  });

  // Persist return QR to the request
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