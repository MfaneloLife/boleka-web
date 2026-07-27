import { prisma } from '@/lib/prisma';
import { Order, OrderStatus, OrderItem, PaymentMethod, calculateOrderTotals } from '../types/order';

/**
 * Subtract booked quantity from an item when a booking transitions to PAID.
 * If quantity reaches 0, the items API will automatically filter it from listings.
 */
export async function decrementItemQuantity(itemId: string): Promise<void> {
  try {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item || item.quantity <= 0) return;

    await prisma.item.update({
      where: { id: itemId },
      data: { quantity: { decrement: 1 } },
    });

    console.log(`[inventory] Decremented quantity for item ${itemId} from ${item.quantity} to ${item.quantity - 1}`);
  } catch (error) {
    console.error(`[inventory] Failed to decrement quantity for item ${itemId}:`, error);
  }
}

/**
 * OrderService - Manages all order operations using Prisma
 */
export class OrderService {
  
  // Create a new order
  static async createOrder(
    userId: string,
    userName: string,
    userEmail: string,
    items: OrderItem[],
    paymentMethod: PaymentMethod,
    userPhone?: string,
    notes?: string
  ): Promise<string> {
    try {
      const { subtotal, platformFee, totalAmount } = calculateOrderTotals(items);
      
      const vendorId = items[0].vendorId;
      const vendorName = items[0].vendorName;
      
      let vendorEmail: string | undefined;
      try {
        const vendor = await prisma.user.findUnique({ where: { id: vendorId } });
        if (vendor) vendorEmail = vendor.email || undefined;
      } catch {}

      for (const item of items) {
        const dbItem = await prisma.item.findUnique({ where: { id: item.itemId } });
        if (!dbItem) throw new Error(`Item not found: ${item.itemName}`);
        if (dbItem.quantity < item.quantity) throw new Error(`Insufficient stock for item: ${item.itemName}`);
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const booking = await prisma.booking.create({
        data: {
          userId, itemId: items[0].itemId, startDate: now, endDate: expiresAt,
          totalPrice: totalAmount, platformFee, notes: notes || `Order from ${vendorName}`, status: 'PENDING'
        }
      });
      
      return booking.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  static async getOrder(orderId: string): Promise<Order | null> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: orderId },
        include: { user: true, item: { include: { user: true } } }
      });
      return booking ? this.bookingToOrder(booking) : null;
    } catch (error) {
      console.error('Error getting order:', error);
      throw new Error('Failed to get order');
    }
  }

  static async getUserOrders(userId: string): Promise<Order[]> {
    const bookings = await prisma.booking.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' },
      include: { user: true, item: { include: { user: true } } }
    });
    return bookings.map(b => this.bookingToOrder(b));
  }

  static async getVendorOrders(vendorId: string): Promise<Order[]> {
    const bookings = await prisma.booking.findMany({
      where: { item: { userId: vendorId } }, orderBy: { createdAt: 'desc' },
      include: { user: true, item: { include: { user: true } } }
    });
    return bookings.map(b => this.bookingToOrder(b));
  }

  static async getPendingApprovalOrders(vendorId: string): Promise<Order[]> {
    const bookings = await prisma.booking.findMany({
      where: { status: 'PENDING', item: { userId: vendorId } }, orderBy: { createdAt: 'asc' },
      include: { user: true, item: { include: { user: true } } }
    });
    return bookings.map(b => this.bookingToOrder(b));
  }

  static async approveOrder(orderId: string, vendorId: string, approvalNotes?: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: orderId }, include: { item: true } });
    if (!booking) throw new Error('Order not found');
    if (booking.item.userId !== vendorId) throw new Error('Unauthorized to approve this order');
    if (booking.status !== 'PENDING') throw new Error('Order is not pending');

    await prisma.booking.update({
      where: { id: orderId },
      data: { status: 'PAID', notes: approvalNotes || booking.notes }
    });

    // Decrement item quantity
    await decrementItemQuantity(booking.itemId);
  }

  static async declineOrder(orderId: string, vendorId: string, reason: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: orderId }, include: { item: true } });
    if (!booking) throw new Error('Order not found');
    if (booking.item.userId !== vendorId) throw new Error('Unauthorized to decline this order');
    if (booking.status !== 'PENDING') throw new Error('Order is not pending');

    await prisma.booking.update({
      where: { id: orderId },
      data: { status: 'CANCELLED', notes: `Declined: ${reason}` }
    });
  }

  static async markPaymentReceived(
    orderId: string, paymentId: string, paymentReference: string,
    paymentAmount: number, paidBy: string
  ): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: orderId } });
    if (!booking) throw new Error('Order not found');
    if (!['PENDING', 'PAID'].includes(booking.status)) throw new Error('Order is not awaiting payment');

    await prisma.booking.update({
      where: { id: orderId },
      data: { status: 'PAID', totalPrice: paymentAmount, notes: `Payment received: ${paymentReference}` }
    });

    // Decrement item quantity
    await decrementItemQuantity(booking.itemId);
  }

  static async freezeOrderPayout(orderId: string, reason: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: orderId } });
    if (!booking) throw new Error('Order not found');
    if (booking.status !== 'PAID') throw new Error('Order must be in PAID status to freeze');

    await prisma.booking.update({
      where: { id: orderId },
      data: { status: 'FROZEN', notes: `Payout frozen: ${reason}` }
    });
  }

  static async releaseOrderPayout(orderId: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: orderId } });
    if (!booking) throw new Error('Order not found');
    if (!['FROZEN', 'PAID'].includes(booking.status)) throw new Error('Order must be in PAID or FROZEN status');

    await prisma.booking.update({
      where: { id: orderId },
      data: { status: 'PAID' }
    });
  }

  static async generateQRCode(orderId: string, userId: string): Promise<{ qrData: string; expiresAt: Date }> {
    const booking = await prisma.booking.findUnique({ where: { id: orderId } });
    if (!booking) throw new Error('Order not found');
    if (booking.userId !== userId) throw new Error('Unauthorized');
    if (booking.status !== 'PAID') throw new Error('Order payment not yet received');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 120 * 1000);
    const qrData = JSON.stringify({ orderId, userId, vendorId: booking.itemId, timestamp: now.getTime(), expiresAt: expiresAt.getTime() });

    await prisma.booking.update({
      where: { id: orderId },
      data: { qrCode: qrData, qrCodeExpiresAt: expiresAt }
    });

    return { qrData, expiresAt };
  }

  static async completeOrderWithQR(qrCode: string, scannerId: string): Promise<void> {
    let qrData: any;
    try { qrData = JSON.parse(qrCode); } catch { throw new Error('Invalid QR code format'); }

    const booking = await prisma.booking.findUnique({ where: { id: qrData.orderId }, include: { item: true } });
    if (!booking) throw new Error('Order not found');
    if (booking.item.userId !== scannerId) throw new Error('Unauthorized');
    if (booking.qrCodeExpiresAt && new Date() > booking.qrCodeExpiresAt) throw new Error('QR code has expired');
    if (booking.qrCode !== qrCode) throw new Error('Invalid QR code');
    if (booking.status !== 'PAID') throw new Error('Order payment not yet received');

    const now = new Date();
    const platformCommission = booking.totalPrice * 0.05;
    const vendorPayout = booking.totalPrice - platformCommission;

    await prisma.booking.update({
      where: { id: qrData.orderId },
      data: {
        status: 'COMPLETED', qrCodeScannedAt: now,
        platformCommission, vendorPayoutAmount: vendorPayout, commissionPaid: true,
        returnStatus: booking.endDate ? 'NOT_RETURNED' : 'RETURNED',
        notes: booking.notes ? `${booking.notes} | Completed via QR` : `Completed via QR scan at ${now.toISOString()}`
      }
    });
  }

  static async markItemReturned(orderId: string, vendorId: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: orderId }, include: { item: true } });
    if (!booking) throw new Error('Order not found');
    if (booking.item.userId !== vendorId) throw new Error('Unauthorized');
    if (booking.status !== 'COMPLETED') throw new Error('Order must be COMPLETED');
    if (booking.returnStatus === 'RETURNED') throw new Error('Item already returned');

    const now = new Date();
    await prisma.booking.update({
      where: { id: orderId },
      data: {
        returnStatus: 'RETURNED', returnedAt: now,
        notes: booking.notes ? `${booking.notes} | Returned at ${now.toISOString()}` : `Returned at ${now.toISOString()}`
      }
    });
  }

  /**
   * Generate a return QR code for the vendor to show to the buyer.
   * Buyer scans this QR to return the item.
   * Only the vendor can generate this QR.
   */
  static async generateReturnQR(orderId: string, vendorId: string): Promise<{ qrData: string; expiresAt: Date }> {
    const booking = await prisma.booking.findUnique({ where: { id: orderId }, include: { item: true } });
    if (!booking) throw new Error('Order not found');
    if (booking.item.userId !== vendorId) throw new Error('Unauthorized: Only the vendor can generate return QR');
    if (booking.status !== 'COMPLETED') throw new Error('Order must be COMPLETED to generate return QR');
    if (booking.returnStatus === 'RETURNED') throw new Error('Item has already been returned');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 120 * 1000);
    const qrData = JSON.stringify({
      orderId,
      action: 'return',
      vendorId: booking.item.userId,
      timestamp: now.getTime(),
      expiresAt: expiresAt.getTime()
    });

    await prisma.booking.update({
      where: { id: orderId },
      data: { qrCode: qrData, qrCodeExpiresAt: expiresAt }
    });

    return { qrData, expiresAt };
  }

  /**
   * Buyer scans the vendor's return QR code to mark the item as returned.
   * Only the buyer (renter/userId on the booking) can scan the return QR.
   */
  static async completeReturnWithQR(qrCode: string, scannerId: string): Promise<void> {
    let qrData: any;
    try { qrData = JSON.parse(qrCode); } catch { throw new Error('Invalid QR code format'); }

    if (qrData.action !== 'return') {
      throw new Error('This is not a return QR code');
    }

    const booking = await prisma.booking.findUnique({ where: { id: qrData.orderId }, include: { item: true } });
    if (!booking) throw new Error('Order not found');
    if (booking.userId !== scannerId) throw new Error('Unauthorized: Only the buyer can scan the return QR');
    if (booking.qrCodeExpiresAt && new Date() > booking.qrCodeExpiresAt) throw new Error('Return QR code has expired');
    if (booking.qrCode !== qrCode) throw new Error('Invalid return QR code');
    if (booking.status !== 'COMPLETED') throw new Error('Order must be COMPLETED to return');
    if (booking.returnStatus === 'RETURNED') throw new Error('Item already returned');

    const now = new Date();
    await prisma.booking.update({
      where: { id: qrData.orderId },
      data: {
        returnStatus: 'RETURNED',
        returnedAt: now,
        qrCodeScannedAt: now,
        notes: booking.notes
          ? `${booking.notes} | Item returned via QR at ${now.toISOString()}`
          : `Item returned via QR at ${now.toISOString()}`
      }
    });
  }

  static async getExpiredOrders(): Promise<Order[]> {
    const now = new Date();
    const bookings = await prisma.booking.findMany({
      where: { status: 'PENDING', endDate: { lte: now } },
      include: { user: true, item: { include: { user: true } } }
    });
    return bookings.map(b => this.bookingToOrder(b));
  }

  static async cleanupExpiredOrders(): Promise<number> {
    const expired = await this.getExpiredOrders();
    if (expired.length === 0) return 0;
    const result = await prisma.booking.updateMany({
      where: { id: { in: expired.map(o => o.id) } },
      data: { status: 'CANCELLED', notes: 'Order expired automatically' }
    });
    return result.count;
  }

  /**
   * Initiate a cash payment request. Creates a pending Payment record and
   * sets the Request to CASH_PAYMENT_PENDING. The buyer then generates a QR
   * code and shows it to the vendor, who scans it to confirm cash received.
   */
  static async initiateCashPayment(requestId: string, userId: string, amount: number): Promise<{ paymentId: string }> {
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
   * Generate a cash payment confirmation QR code for the buyer to show
   * to the vendor. The vendor scans this QR to confirm cash receipt.
   */
  static async generateCashPaymentQR(requestId: string, userId: string): Promise<{ qrData: string; expiresAt: Date }> {
    const requestRecord = await prisma.request.findUnique({ where: { id: requestId } });
    if (!requestRecord) throw new Error('Request not found');
    if (requestRecord.requesterId !== userId) throw new Error('Unauthorized: Only the buyer can generate this QR');
    if (requestRecord.status !== 'CASH_PAYMENT_PENDING') throw new Error('Request must be in CASH_PAYMENT_PENDING status');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 120 * 1000); // 120 seconds

    const qrData = JSON.stringify({
      action: 'cash_payment_confirm',
      requestId,
      amount: requestRecord.totalPrice,
      buyerId: userId,
      ownerId: requestRecord.ownerId,
      itemId: requestRecord.itemId,
      timestamp: now.getTime(),
      expiresAt: expiresAt.getTime(),
    });

    return { qrData, expiresAt };
  }

  /**
   * Vendor scans the buyer's cash payment QR code to confirm cash received.
   * This marks the Payment as PAID, Request as PAID, creates a Booking,
   * and decrements item quantity.
   */
  static async confirmCashPaymentWithQR(qrCode: string, scannerId: string): Promise<{ requestId: string; bookingId: string; paymentId: string }> {
    let qrData: any;
    try { qrData = JSON.parse(qrCode); } catch { throw new Error('Invalid QR code format'); }

    if (qrData.action !== 'cash_payment_confirm') throw new Error('This is not a cash payment confirmation QR code');
    if (!qrData.requestId) throw new Error('Invalid QR code: missing requestId');

    // Check expiry
    if (qrData.expiresAt && Date.now() > qrData.expiresAt) throw new Error('Cash payment QR code has expired');

    const requestRecord = await prisma.request.findUnique({
      where: { id: qrData.requestId },
      include: { item: true },
    });

    if (!requestRecord) throw new Error('Request not found');
    if (requestRecord.ownerId !== scannerId) throw new Error('Unauthorized: Only the item owner can confirm cash payment');
    if (requestRecord.status !== 'CASH_PAYMENT_PENDING') throw new Error('Request is not in CASH_PAYMENT_PENDING status');

    const amount = requestRecord.totalPrice || 0;
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const result = await prisma.$transaction(async (tx) => {
      // Mark the pending payment as PAID
      const pendingPayment = await tx.payment.findFirst({
        where: { requestId: qrData.requestId, status: 'PENDING', method: 'CASH' },
        orderBy: { createdAt: 'desc' },
      });

      if (!pendingPayment) throw new Error('No pending cash payment found for this request');

      const payment = await tx.payment.update({
        where: { id: pendingPayment.id },
        data: { status: 'PAID' },
      });

      // Update Request status to PAID
      await tx.request.update({
        where: { id: qrData.requestId },
        data: { status: 'PAID' },
      });

      // Create a Booking record for the return flow
      const booking = await tx.booking.create({
        data: {
          userId: requestRecord.requesterId,
          itemId: requestRecord.itemId,
          status: 'COMPLETED',
          startDate: now,
          endDate,
          totalPrice: amount,
          platformFee: 0,
          platformCommission: 0,
          vendorPayoutAmount: amount,
          returnStatus: 'NOT_RETURNED',
          notes: `Cash payment for request #${requestRecord.id.slice(-8)} | Confirmed via QR by vendor at ${now.toISOString()}`,
        },
      });

      // Decrement item quantity
      if (requestRecord.item && requestRecord.item.quantity > 0) {
        await tx.item.update({
          where: { id: requestRecord.item.id },
          data: { quantity: { decrement: 1 } },
        });
      }

      return { booking, payment };
    });

    return {
      requestId: requestRecord.id,
      bookingId: result.booking.id,
      paymentId: result.payment.id,
    };
  }

  private static bookingToOrder(booking: any): Order {
    return {
      id: booking.id, userId: booking.userId, userName: booking.user?.name || '',
      userEmail: booking.user?.email || '', userPhone: booking.user?.phone,
      items: [], subtotal: booking.totalPrice - booking.platformFee,
      platformFee: booking.platformFee, totalAmount: booking.totalPrice,
      status: this.convertBookingStatusToOrderStatus(booking.status),
      paymentMethod: 'card' as PaymentMethod,
      vendorId: booking.item?.userId || '', vendorName: booking.item?.user?.name || '',
      vendorEmail: booking.item?.user?.email || '',
      createdAt: booking.createdAt, updatedAt: booking.updatedAt, notes: booking.notes
    } as Order;
  }

  private static convertBookingStatusToOrderStatus(status: string): OrderStatus {
    const mapping: Record<string, OrderStatus> = {
      'PENDING': OrderStatus.AWAITING_APPROVAL,
      'PAID': OrderStatus.PAYMENT_RECEIVED,
      'COMPLETED': OrderStatus.COMPLETED,
      'CANCELLED': OrderStatus.CANCELLED,
      'FROZEN': OrderStatus.FROZEN
    };
    return mapping[status] || OrderStatus.AWAITING_APPROVAL;
  }
}