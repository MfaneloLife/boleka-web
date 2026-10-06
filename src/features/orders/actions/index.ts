'use server';

import { prisma } from '@/lib/prisma';

/**
 * Order mutations — the single writer for order/transaction state.
 *
 * E-BOLEKA is a hybrid marketplace: an `Item` is listed for SELLING, RENTING,
 * or BOTH (`Item.itemType`). A transaction is represented by a `Request`
 * (requester = buyer/renter, owner = seller/lender), with `Payment` records
 * tracking the money. These server actions replace the retired `Booking`
 * model mutations so all database writes flow through one obvious place.
 */

/**
 * Initiate a cash payment request. Creates a pending Payment and sets the
 * Request to CASH_PAYMENT_PENDING. The buyer then shows a QR to the vendor,
 * who scans it to confirm cash receipt.
 */
export async function initiateCashPayment(
  requestId: string,
  userId: string,
  amount: number
): Promise<{ paymentId: string }> {
  const requestRecord = await prisma.request.findUnique({
    where: { id: requestId },
    include: { item: true },
  });

  if (!requestRecord) throw new Error('Request not found');
  if (requestRecord.requesterId !== userId) throw new Error('Only the buyer can initiate cash payment');

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        requestId: requestRecord.id,
        payerId: userId,
        amount: Number(amount),
        status: 'PENDING',
        method: 'CASH',
      },
    });

    await tx.request.update({
      where: { id: requestId },
      data: { status: 'CASH_PAYMENT_PENDING' },
    });

    return { payment };
  });

  return { paymentId: result.payment.id };
}

/**
 * Vendor scans the buyer's cash payment QR to confirm cash received.
 * Marks the Payment PAID, the Request PAID, and decrements item quantity.
 */
export async function confirmCashPaymentWithQR(
  qrCode: string,
  scannerId: string
): Promise<{ requestId: string; paymentId: string }> {
  let qrData: any;
  try {
    qrData = JSON.parse(qrCode);
  } catch {
    throw new Error('Invalid QR code format');
  }

  if (qrData.action !== 'cash_payment_confirm') {
    throw new Error('This is not a cash payment confirmation QR code');
  }
  if (!qrData.requestId) throw new Error('Invalid QR code: missing requestId');
  if (qrData.expiresAt && Date.now() > qrData.expiresAt) throw new Error('Cash payment QR code has expired');

  const requestRecord = await prisma.request.findUnique({
    where: { id: qrData.requestId },
    include: { item: true },
  });

  if (!requestRecord) throw new Error('Request not found');
  if (requestRecord.ownerId !== scannerId) throw new Error('Unauthorized: Only the item owner can confirm cash payment');
  if (requestRecord.status !== 'CASH_PAYMENT_PENDING') throw new Error('Request is not in CASH_PAYMENT_PENDING status');

  const result = await prisma.$transaction(async (tx) => {
    const pendingPayment = await tx.payment.findFirst({
      where: { requestId: qrData.requestId, status: 'PENDING', method: 'CASH' },
      orderBy: { createdAt: 'desc' },
    });

    if (!pendingPayment) throw new Error('No pending cash payment found for this request');

    const payment = await tx.payment.update({
      where: { id: pendingPayment.id },
      data: { status: 'PAID' },
    });

    await tx.request.update({
      where: { id: qrData.requestId },
      data: { status: 'PAID' },
    });

    if (requestRecord.item && requestRecord.item.quantity > 0) {
      await tx.item.update({
        where: { id: requestRecord.item.id },
        data: { quantity: { decrement: 1 } },
      });
    }

    return { payment };
  });

  return { requestId: requestRecord.id, paymentId: result.payment.id };
}

/**
 * Vendor scans the renter's completion QR → mark the Request COMPLETED.
 */
export async function completeOrderWithQR(qrCode: string, scannerId: string): Promise<void> {
  let qrData: any;
  try {
    qrData = JSON.parse(qrCode);
  } catch {
    throw new Error('Invalid QR code format');
  }

  const orderId = qrData.orderId ?? qrData.requestId;
  if (!orderId) throw new Error('Invalid QR code: missing order id');

  const request = await prisma.request.findUnique({
    where: { id: orderId },
    include: { item: true },
  });

  if (!request) throw new Error('Order not found');
  if (request.ownerId !== scannerId) throw new Error('Unauthorized');
  if (request.qrCodeExpiresAt && new Date() > request.qrCodeExpiresAt) throw new Error('QR code has expired');
  if (request.qrCode !== qrCode) throw new Error('Invalid QR code');
  if (request.status !== 'PAID') throw new Error('Order payment not yet received');

  await prisma.request.update({
    where: { id: orderId },
    data: {
      status: 'COMPLETED',
      qrCodeScannedAt: new Date(),
      returnStatus: request.endDate ? 'NOT_RETURNED' : 'RETURNED',
    },
  });
}

/**
 * Buyer scans the vendor's return QR → mark the Request returned.
 */
export async function completeReturnWithQR(qrCode: string, scannerId: string): Promise<void> {
  let qrData: any;
  try {
    qrData = JSON.parse(qrCode);
  } catch {
    throw new Error('Invalid QR code format');
  }

  if (qrData.action !== 'return') throw new Error('This is not a return QR code');

  const orderId = qrData.orderId ?? qrData.requestId;
  if (!orderId) throw new Error('Invalid QR code: missing order id');

  const request = await prisma.request.findUnique({
    where: { id: orderId },
    include: { item: true },
  });

  if (!request) throw new Error('Order not found');
  if (request.requesterId !== scannerId) throw new Error('Unauthorized: Only the buyer can scan the return QR');
  if (request.qrCodeExpiresAt && new Date() > request.qrCodeExpiresAt) throw new Error('Return QR code has expired');
  if (request.qrCode !== qrCode) throw new Error('Invalid return QR code');
  if (request.status !== 'COMPLETED') throw new Error('Order must be COMPLETED to return');
  if (request.returnStatus === 'RETURNED') throw new Error('Item already returned');

  await prisma.request.update({
    where: { id: orderId },
    data: {
      returnStatus: 'RETURNED',
      returnedAt: new Date(),
      qrCodeScannedAt: new Date(),
    },
  });
}

