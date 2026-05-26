import { prisma } from '@/lib/prisma';
import { Order, OrderStatus, OrderItem, PaymentMethod, calculateOrderTotals, calculatePayoutSplit } from '../types/order';

/**
 * OrderService - Manages all order operations using Prisma
 * Replaces Firebase Firestore with PostgreSQL via Prisma
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
      // Calculate totals
      const { subtotal, platformFee, totalAmount } = calculateOrderTotals(items);
      
      // Get vendor info from first item
      const vendorId = items[0].vendorId;
      const vendorName = items[0].vendorName;
      
      // Lookup vendor from Prisma
      let vendorEmail: string | undefined;
      try {
        const vendor = await prisma.user.findUnique({
          where: { id: vendorId }
        });
        if (vendor) {
          vendorEmail = vendor.email || undefined;
        }
      } catch {
        vendorEmail = undefined;
      }

      // Verify all items exist and have sufficient stock
      for (const item of items) {
        const dbItem = await prisma.item.findUnique({
          where: { id: item.itemId }
        });
        
        if (!dbItem) {
          throw new Error(`Item not found: ${item.itemName}`);
        }
        
        if (dbItem.quantity < item.quantity) {
          throw new Error(`Insufficient stock for item: ${item.itemName}`);
        }
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Create booking as order
      const booking = await prisma.booking.create({
        data: {
          userId,
          itemId: items[0].itemId,
          startDate: now,
          endDate: expiresAt,
          totalPrice: totalAmount,
          platformFee,
          notes: notes || `Order from ${vendorName}`,
          status: 'PENDING'
        }
      });
      
      return booking.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  // Get order by ID
  static async getOrder(orderId: string): Promise<Order | null> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: orderId },
        include: {
          user: true,
          item: {
            include: { user: true }
          }
        }
      });
      
      if (!booking) {
        return null;
      }
      
      return this.bookingToOrder(booking);
    } catch (error) {
      console.error('Error getting order:', error);
      throw new Error('Failed to get order');
    }
  }

  // Get orders for a user
  static async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const bookings = await prisma.booking.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          item: {
            include: { user: true }
          }
        }
      });
      
      return bookings.map(booking => this.bookingToOrder(booking));
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw new Error('Failed to get user orders');
    }
  }

  // Get orders for a vendor
  static async getVendorOrders(vendorId: string): Promise<Order[]> {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          item: {
            userId: vendorId
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          item: {
            include: { user: true }
          }
        }
      });
      
      return bookings.map(booking => this.bookingToOrder(booking));
    } catch (error) {
      console.error('Error getting vendor orders:', error);
      throw new Error('Failed to get vendor orders');
    }
  }

  // Get pending approval orders for vendor
  static async getPendingApprovalOrders(vendorId: string): Promise<Order[]> {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          status: 'PENDING',
          item: {
            userId: vendorId
          }
        },
        orderBy: { createdAt: 'asc' },
        include: {
          user: true,
          item: {
            include: { user: true }
          }
        }
      });
      
      return bookings.map(booking => this.bookingToOrder(booking));
    } catch (error) {
      console.error('Error getting pending approval orders:', error);
      throw new Error('Failed to get pending approval orders');
    }
  }

  // Approve order
  static async approveOrder(
    orderId: string, 
    vendorId: string, 
    approvalNotes?: string
  ): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: orderId },
        include: { item: true }
      });
      
      if (!booking) {
        throw new Error('Order not found');
      }

      if (booking.item.userId !== vendorId) {
        throw new Error('Unauthorized to approve this order');
      }

      if (booking.status !== 'PENDING') {
        throw new Error('Order is not pending');
      }

      await prisma.booking.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          notes: approvalNotes || booking.notes
        }
      });
    } catch (error) {
      console.error('Error approving order:', error);
      throw new Error('Failed to approve order');
    }
  }

  // Decline order
  static async declineOrder(
    orderId: string, 
    vendorId: string, 
    reason: string
  ): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: orderId },
        include: { item: true }
      });
      
      if (!booking) {
        throw new Error('Order not found');
      }

      if (booking.item.userId !== vendorId) {
        throw new Error('Unauthorized to decline this order');
      }

      if (booking.status !== 'PENDING') {
        throw new Error('Order is not pending');
      }

      await prisma.booking.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          notes: `Declined: ${reason}`
        }
      });
    } catch (error) {
      console.error('Error declining order:', error);
      throw new Error('Failed to decline order');
    }
  }

  // Mark payment as received
  static async markPaymentReceived(
    orderId: string,
    paymentId: string,
    paymentReference: string,
    paymentAmount: number,
    paidBy: string
  ): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: orderId }
      });
      
      if (!booking) {
        throw new Error('Order not found');
      }

      if (!['PENDING', 'PAID'].includes(booking.status)) {
        throw new Error('Order is not awaiting payment');
      }

      await prisma.booking.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          totalPrice: paymentAmount,
          notes: `Payment received: ${paymentReference}`
        }
      });
    } catch (error) {
      console.error('Error marking payment as received:', error);
      throw new Error('Failed to mark payment as received');
    }
  }

  // Freeze order payout
  static async freezeOrderPayout(orderId: string, reason: string): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: orderId }
      });
      
      if (!booking) {
        throw new Error('Order not found');
      }

      if (booking.status !== 'PAID') {
        throw new Error('Order must be in PAID status to freeze');
      }

      await prisma.booking.update({
        where: { id: orderId },
        data: {
          status: 'FROZEN',
          notes: `Payout frozen: ${reason}`
        }
      });
    } catch (error) {
      console.error('Error freezing order payout:', error);
      throw new Error('Failed to freeze order payout');
    }
  }

  // Release frozen payout
  static async releaseOrderPayout(orderId: string): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: orderId }
      });
      
      if (!booking) {
        throw new Error('Order not found');
      }

      if (!['FROZEN', 'PAID'].includes(booking.status)) {
        throw new Error('Order must be in PAID or FROZEN status to release payout');
      }

      await prisma.booking.update({
        where: { id: orderId },
        data: {
          status: 'PAID'
        }
      });
    } catch (error) {
      console.error('Error releasing order payout:', error);
      throw new Error('Failed to release order payout');
    }
  }

  // Generate QR code for order completion (120-second expiry)
  static async generateQRCode(orderId: string, userId: string): Promise<{ qrData: string; expiresAt: Date }> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: orderId }
      });
      
      if (!booking) {
        throw new Error('Order not found');
      }

      if (booking.userId !== userId) {
        throw new Error('Unauthorized to generate QR code for this order');
      }

      if (booking.status !== 'PAID') {
        throw new Error('Order payment not yet received');
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 120 * 1000); // 120 seconds

      const qrPayload = {
        orderId,
        userId,
        vendorId: booking.itemId, // will resolve vendor from item
        timestamp: now.getTime(),
        expiresAt: expiresAt.getTime()
      };

      const qrData = JSON.stringify(qrPayload);

      // Store QR code and expiry in the database
      await prisma.booking.update({
        where: { id: orderId },
        data: {
          qrCode: qrData,
          qrCodeExpiresAt: expiresAt
        }
      });

      return { qrData, expiresAt };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Complete order using QR code (vendor scans renter's QR)
  static async completeOrderWithQR(
    qrCode: string,
    scannerId: string
  ): Promise<void> {
    try {
      let qrData: any;
      try {
        qrData = JSON.parse(qrCode);
      } catch {
        throw new Error('Invalid QR code format');
      }

      const orderId = qrData.orderId;

      const booking = await prisma.booking.findUnique({
        where: { id: orderId },
        include: { item: true }
      });
      
      if (!booking) {
        throw new Error('Order not found');
      }

      // Verify the scanner is the vendor/shop owner
      if (booking.item.userId !== scannerId) {
        throw new Error('Unauthorized: Only the vendor can scan this QR code');
      }

      // Check QR code hasn't expired
      if (booking.qrCodeExpiresAt && new Date() > booking.qrCodeExpiresAt) {
        throw new Error('QR code has expired. Please ask the customer to generate a new one.');
      }

      // Verify QR code matches stored one
      if (booking.qrCode !== qrCode) {
        throw new Error('Invalid QR code. Please ask the customer to generate a new one.');
      }

      if (booking.status !== 'PAID') {
        throw new Error('Order payment not yet received');
      }

      const now = new Date();

      // Calculate payout split: 5% platform commission, 95% to vendor
      const platformCommission = booking.totalPrice * 0.05;
      const vendorPayout = booking.totalPrice - platformCommission;

      // Update booking to COMPLETED and track return
      await prisma.booking.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          qrCodeScannedAt: now,
          platformCommission: platformCommission,
          vendorPayoutAmount: vendorPayout,
          commissionPaid: true,
          // For rentals, mark as NOT_RETURNED initially; for selling, mark as RETURNED
          returnStatus: booking.endDate ? 'NOT_RETURNED' : 'RETURNED',
          notes: booking.notes 
            ? `${booking.notes} | Completed via QR scan at ${now.toISOString()}`
            : `Completed via QR scan at ${now.toISOString()}`
        }
      });
    } catch (error) {
      console.error('Error completing order with QR code:', error);
      throw error;
    }
  }

  // Mark item as returned by renter (only for rentals)
  static async markItemReturned(
    orderId: string,
    vendorId: string
  ): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: orderId },
        include: { item: true }
      });
      
      if (!booking) {
        throw new Error('Order not found');
      }

      if (booking.item.userId !== vendorId) {
        throw new Error('Unauthorized: Only the vendor can mark item as returned');
      }

      if (booking.status !== 'COMPLETED') {
        throw new Error('Order must be in COMPLETED status to mark as returned');
      }

      if (booking.returnStatus === 'RETURNED') {
        throw new Error('Item has already been returned');
      }

      const now = new Date();

      await prisma.booking.update({
        where: { id: orderId },
        data: {
          returnStatus: 'RETURNED',
          returnedAt: now,
          notes: booking.notes 
            ? `${booking.notes} | Item returned at ${now.toISOString()}`
            : `Item returned at ${now.toISOString()}`
        }
      });
    } catch (error) {
      console.error('Error marking item returned:', error);
      throw error;
    }
  }


  // Get expired orders
  static async getExpiredOrders(): Promise<Order[]> {
    try {
      const now = new Date();
      
      const bookings = await prisma.booking.findMany({
        where: {
          status: 'PENDING',
          endDate: {
            lte: now
          }
        },
        include: {
          user: true,
          item: {
            include: { user: true }
          }
        }
      });

      return bookings.map(booking => this.bookingToOrder(booking));
    } catch (error) {
      console.error('Error getting expired orders:', error);
      throw new Error('Failed to get expired orders');
    }
  }

  // Clean up expired orders
  static async cleanupExpiredOrders(): Promise<number> {
    try {
      const expiredOrders = await this.getExpiredOrders();
      
      if (expiredOrders.length === 0) {
        return 0;
      }

      const result = await prisma.booking.updateMany({
        where: {
          id: {
            in: expiredOrders.map(o => o.id)
          }
        },
        data: {
          status: 'CANCELLED',
          notes: 'Order expired automatically'
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired orders:', error);
      throw new Error('Failed to cleanup expired orders');
    }
  }

  // Helper method to transform booking to order
  private static bookingToOrder(booking: any): Order {
    return {
      id: booking.id,
      userId: booking.userId,
      userName: booking.user?.name || '',
      userEmail: booking.user?.email || '',
      userPhone: booking.user?.phone,
      items: [],
      subtotal: booking.totalPrice - booking.platformFee,
      platformFee: booking.platformFee,
      totalAmount: booking.totalPrice,
      status: this.convertBookingStatusToOrderStatus(booking.status),
      paymentMethod: 'card' as PaymentMethod,
      vendorId: booking.item?.userId || '',
      vendorName: booking.item?.user?.name || '',
      vendorEmail: booking.item?.user?.email || '',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      notes: booking.notes
    } as Order;
  }

  // Helper to convert booking status to order status
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
