import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/requests/[requestId]/scan-qr
 *
 * Unified QR scan endpoint for the Request model:
 * - Completion QR: vendor scans renter's QR → SUCCESSFUL → COMPLETED
 * - Return QR:    renter scans vendor's return QR → COMPLETED → RETURNED
 *
 * Body: { qrCode: string }
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

  let qrCode: string;
  try {
    const body = await request.json();
    qrCode = String(body.qrCode ?? '');
    if (!qrCode) {
      return NextResponse.json({ error: 'qrCode is required' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Parse QR data
  let qrData: any;
  try {
    qrData = JSON.parse(qrCode);
  } catch {
    return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 });
  }

  if (!qrData.requestId || qrData.requestId !== requestId) {
    return NextResponse.json(
      { error: 'QR code does not match this request' },
      { status: 400 }
    );
  }

  // Fetch the request
  const requestRecord = await prisma.request.findUnique({
    where: { id: requestId },
    include: { item: { select: { userId: true, price: true } } },
  });

  if (!requestRecord) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const now = new Date();

  // Check if this is a return QR (action === 'return')
  if (qrData.action === 'return') {
    // Renter scans vendor's return QR to mark item as returned
    if (userId !== requestRecord.requesterId) {
      return NextResponse.json(
        { error: 'Only the renter can scan the return QR code' },
        { status: 403 }
      );
    }

    if (requestRecord.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Request must be COMPLETED before returning' },
        { status: 409 }
      );
    }

    if (requestRecord.returnStatus === 'RETURNED') {
      return NextResponse.json(
        { error: 'Item has already been returned' },
        { status: 409 }
      );
    }

    // Verify QR expiry
    if (requestRecord.qrCodeExpiresAt && now > requestRecord.qrCodeExpiresAt) {
      return NextResponse.json({ error: 'Return QR code has expired' }, { status: 410 });
    }

    // Verify QR matches stored value
    if (requestRecord.qrCode !== qrCode) {
      return NextResponse.json({ error: 'Invalid return QR code' }, { status: 400 });
    }

    await prisma.request.update({
      where: { id: requestId },
      data: {
        returnStatus: 'RETURNED',
        returnedAt: now,
        qrCodeScannedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Item returned successfully via QR scan.',
      requestId,
      action: 'return',
    });
  }

  // Default: vendor scans renter's completion QR
  if (userId !== requestRecord.ownerId) {
    return NextResponse.json(
      { error: 'Only the vendor can scan the completion QR code' },
      { status: 403 }
    );
  }

  if (requestRecord.status !== 'SUCCESSFUL') {
    return NextResponse.json(
      { error: `Cannot complete a request with status "${requestRecord.status}". Settlement must be done first.` },
      { status: 409 }
    );
  }

  // Verify QR expiry
  if (requestRecord.qrCodeExpiresAt && now > requestRecord.qrCodeExpiresAt) {
    return NextResponse.json({ error: 'QR code has expired' }, { status: 410 });
  }

  // Verify QR matches stored value
  if (requestRecord.qrCode !== qrCode) {
    return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
  }

  await prisma.request.update({
    where: { id: requestId },
    data: {
      status: 'COMPLETED',
      qrCodeScannedAt: now,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Booking completed successfully via QR scan.',
    requestId,
    action: 'complete',
  });
}