import { prisma } from '@/lib/prisma';
import { Order, OrderStatus, PaymentMethod } from '../types/order';

/**
 * OrderService — query layer for order/transaction reads.
 *
 * Maps the current Prisma `Request` model (the replacement for the retired
 * `Booking` model) onto the legacy `Order` shape for presentation. All
 * database mutations live in `src/features/orders/actions` (Single Writer).
 */
export class OrderService {
  static async getOrder(orderId: string): Promise<Order | null> {
    try {
      const request = await prisma.request.findUnique({
        where: { id: orderId },
        include: { item: { include: { user: true } }, requester: true, owner: true },
      });
      return request ? this.requestToOrder(request) : null;
    } catch (error) {
      console.error('Error getting order:', error);
      throw new Error('Failed to get order');
    }
  }

  static async getUserOrders(userId: string): Promise<Order[]> {
    const requests = await prisma.request.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: { item: { include: { user: true } }, requester: true, owner: true },
    });
    return requests.map((r) => this.requestToOrder(r));
  }

  static async getVendorOrders(ownerId: string): Promise<Order[]> {
    const requests = await prisma.request.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: { item: { include: { user: true } }, requester: true, owner: true },
    });
    return requests.map((r) => this.requestToOrder(r));
  }

  static async getPendingApprovalOrders(ownerId: string): Promise<Order[]> {
    const requests = await prisma.request.findMany({
      where: { status: 'PENDING', ownerId },
      orderBy: { createdAt: 'asc' },
      include: { item: { include: { user: true } }, requester: true, owner: true },
    });
    return requests.map((r) => this.requestToOrder(r));
  }

  static async getExpiredOrders(): Promise<Order[]> {
    const now = new Date();
    const requests = await prisma.request.findMany({
      where: { status: 'PENDING', endDate: { lte: now } },
      include: { item: { include: { user: true } }, requester: true, owner: true },
    });
    return requests.map((r) => this.requestToOrder(r));
  }

  /**
   * Generate a cash payment confirmation QR code for the buyer to show the
   * vendor. The vendor scans it to confirm cash receipt. (Read-only.)
   */
  static async generateCashPaymentQR(
    requestId: string,
    userId: string
  ): Promise<{ qrData: string; expiresAt: Date }> {
    const requestRecord = await prisma.request.findUnique({ where: { id: requestId } });
    if (!requestRecord) throw new Error('Request not found');
    if (requestRecord.requesterId !== userId) throw new Error('Unauthorized: Only the buyer can generate this QR');
    if (requestRecord.status !== 'CASH_PAYMENT_PENDING') throw new Error('Request must be in CASH_PAYMENT_PENDING status');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 120 * 1000);

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

  private static requestToOrder(request: any): Order {
    const total = request.totalPrice ?? request.finalValue ?? 0;
    return {
      id: request.id,
      userId: request.requesterId,
      userName: request.requester?.name || '',
      userEmail: request.requester?.email || '',
      userPhone: request.requester?.phone ?? undefined,
      items: [],
      subtotal: total,
      platformFee: 0,
      totalAmount: total,
      status: this.convertRequestStatusToOrderStatus(request.status),
      paymentMethod: this.convertPaymentMethod(request.paymentMethod),
      vendorId: request.ownerId,
      vendorName: request.owner?.name || request.item?.user?.name || '',
      vendorEmail: request.owner?.email || request.item?.user?.email || '',
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      qrCode: request.qrCode ?? undefined,
      qrCodeExpiresAt: request.qrCodeExpiresAt ?? undefined,
      returnedAt: request.returnedAt ?? undefined,
    } as Order;
  }

  private static convertRequestStatusToOrderStatus(status: string): OrderStatus {
    const mapping: Record<string, OrderStatus> = {
      PENDING: OrderStatus.AWAITING_APPROVAL,
      NEGOTIATING: OrderStatus.AWAITING_APPROVAL,
      ACCEPTED: OrderStatus.AWAITING_PAYMENT,
      REJECTED: OrderStatus.CANCELLED,
      COMPLETED: OrderStatus.COMPLETED,
      PAID: OrderStatus.PAYMENT_RECEIVED,
      CANCELLED: OrderStatus.CANCELLED,
      CASH_PAYMENT_PENDING: OrderStatus.CASH_PAYMENT_PENDING,
      SUCCESSFUL: OrderStatus.COMPLETED,
    };
    return mapping[status] || OrderStatus.AWAITING_APPROVAL;
  }

  private static convertPaymentMethod(method: string | null | undefined): PaymentMethod {
    switch (method) {
      case 'CASH':
        return PaymentMethod.CASH;
      case 'EFT':
        return PaymentMethod.BANK_TRANSFER;
      case 'ONLINE':
        return PaymentMethod.CARD;
      default:
        return PaymentMethod.CASH;
    }
  }
}
