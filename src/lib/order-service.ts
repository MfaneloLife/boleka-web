import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus, OrderItem, PaymentMethod, calculateOrderTotals } from '../types/order';

export class OrderService {
  private static readonly COLLECTION_NAME = 'orders';
  private static readonly STATUS_UPDATES_COLLECTION = 'orderStatusUpdates';

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
      
      // Get vendor info from first item (assuming all items from same vendor)
      const vendorId = items[0].vendorId;
      const vendorName = items[0].vendorName;
      
      // TODO: Get vendor email from vendor profile
      const vendorEmail = `${vendorId}@vendor.com`; // Placeholder
      
      const now = Timestamp.now();
      const expiresAt = new Timestamp(now.seconds + (30 * 24 * 60 * 60), now.nanoseconds); // 30 days from now
      
      const order: Omit<Order, 'id'> = {
        userId,
        userName,
        userEmail,
        userPhone,
        items,
        subtotal,
        platformFee,
        totalAmount,
        status: OrderStatus.AWAITING_APPROVAL,
        paymentMethod,
        vendorId,
        vendorName,
        vendorEmail,
        createdAt: now,
        updatedAt: now,
        expiresAt,
        notes
      };

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), order);
      
      // Create initial status update
      await this.createStatusUpdate(docRef.id, OrderStatus.AWAITING_APPROVAL, 'Order created', userId);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  // Get order by ID
  static async getOrder(orderId: string): Promise<Order | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, orderId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Order;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting order:', error);
      throw new Error('Failed to get order');
    }
  }

  // Get orders for a user
  static async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw new Error('Failed to get user orders');
    }
  }

  // Get orders for a vendor
  static async getVendorOrders(vendorId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('vendorId', '==', vendorId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (error) {
      console.error('Error getting vendor orders:', error);
      throw new Error('Failed to get vendor orders');
    }
  }

  // Get pending approval orders for vendor
  static async getPendingApprovalOrders(vendorId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('vendorId', '==', vendorId),
        where('status', '==', OrderStatus.AWAITING_APPROVAL),
        orderBy('createdAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
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
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.vendorId !== vendorId) {
        throw new Error('Unauthorized to approve this order');
      }

      if (order.status !== OrderStatus.AWAITING_APPROVAL) {
        throw new Error('Order is not awaiting approval');
      }

      const now = Timestamp.now();
      const newStatus = order.paymentMethod === PaymentMethod.CASH 
        ? OrderStatus.CASH_PAYMENT 
        : OrderStatus.AWAITING_PAYMENT;
      
      // For online payments, set payment due date (7 days from approval)
      const paymentDueAt = order.paymentMethod !== PaymentMethod.CASH 
        ? new Timestamp(now.seconds + (7 * 24 * 60 * 60), now.nanoseconds)
        : undefined;

      const updates: Partial<Order> = {
        status: newStatus,
        approvedAt: now,
        updatedAt: now,
        vendorApprovalNotes: approvalNotes,
        paymentDueAt
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, orderId), updates);
      await this.createStatusUpdate(orderId, newStatus, approvalNotes || 'Order approved', vendorId);
      
      // TODO: Send notification to user
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
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.vendorId !== vendorId) {
        throw new Error('Unauthorized to decline this order');
      }

      if (order.status !== OrderStatus.AWAITING_APPROVAL) {
        throw new Error('Order is not awaiting approval');
      }

      const now = Timestamp.now();
      const updates: Partial<Order> = {
        status: OrderStatus.CANCELLED,
        updatedAt: now,
        cancellationReason: reason
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, orderId), updates);
      await this.createStatusUpdate(orderId, OrderStatus.CANCELLED, `Order declined: ${reason}`, vendorId);
      
      // TODO: Send notification to user
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
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (![OrderStatus.AWAITING_PAYMENT, OrderStatus.CASH_PAYMENT].includes(order.status)) {
        throw new Error('Order is not awaiting payment');
      }

      const now = Timestamp.now();
      const updates: Partial<Order> = {
        status: OrderStatus.PAYMENT_RECEIVED,
        updatedAt: now,
        paymentId,
        paymentReference,
        paymentAmount,
        paymentStatus: 'completed'
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, orderId), updates);
      await this.createStatusUpdate(orderId, OrderStatus.PAYMENT_RECEIVED, 'Payment received', paidBy);
      
      // TODO: Send notification to vendor and user
    } catch (error) {
      console.error('Error marking payment as received:', error);
      throw new Error('Failed to mark payment as received');
    }
  }

  // Generate QR code for order completion
  static async generateQRCode(orderId: string, userId: string): Promise<string> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.userId !== userId) {
        throw new Error('Unauthorized to generate QR code for this order');
      }

      if (order.status !== OrderStatus.PAYMENT_RECEIVED) {
        throw new Error('Order payment not yet received');
      }

      // Generate QR code data
      const qrData = {
        orderId,
        userId,
        vendorId: order.vendorId,
        timestamp: Date.now()
      };

      const qrCode = JSON.stringify(qrData);
      const now = Timestamp.now();
      const qrCodeExpiresAt = new Timestamp(now.seconds + 120, now.nanoseconds); // 120 seconds

      const updates: Partial<Order> = {
        qrCode,
        qrCodeExpiresAt,
        updatedAt: now
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, orderId), updates);
      
      return qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Complete order using QR code
  static async completeOrderWithQR(
    qrCode: string,
    vendorId: string
  ): Promise<void> {
    try {
      // Parse QR code
      const qrData = JSON.parse(qrCode);
      const orderId = qrData.orderId;

      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.vendorId !== vendorId) {
        throw new Error('Unauthorized to complete this order');
      }

      if (order.status !== OrderStatus.PAYMENT_RECEIVED) {
        throw new Error('Order payment not yet received');
      }

      // Check if QR code is expired
      if (order.qrCodeExpiresAt && order.qrCodeExpiresAt.toDate() < new Date()) {
        throw new Error('QR code has expired');
      }

      // Verify QR code matches
      if (order.qrCode !== qrCode) {
        throw new Error('Invalid QR code');
      }

      const now = Timestamp.now();
      const updates: Partial<Order> = {
        status: OrderStatus.COMPLETED,
        completedAt: now,
        updatedAt: now,
        qrCode: undefined, // Clear QR code after use
        qrCodeExpiresAt: undefined
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, orderId), updates);
      await this.createStatusUpdate(orderId, OrderStatus.COMPLETED, 'Order completed with QR code', vendorId);
      
      // TODO: Send completion notification
    } catch (error) {
      console.error('Error completing order with QR code:', error);
      throw new Error('Failed to complete order');
    }
  }

  // Create status update record
  private static async createStatusUpdate(
    orderId: string,
    status: OrderStatus,
    notes: string,
    updatedBy: string
  ): Promise<void> {
    try {
      const statusUpdate = {
        orderId,
        status,
        notes,
        updatedBy,
        timestamp: Timestamp.now()
      };

      await addDoc(collection(db, this.STATUS_UPDATES_COLLECTION), statusUpdate);
    } catch (error) {
      console.error('Error creating status update:', error);
      // Don't throw here as it's not critical
    }
  }

  // Get orders that need cleanup (expired)
  static async getExpiredOrders(): Promise<Order[]> {
    try {
      const now = Timestamp.now();
      
      // Get orders awaiting approval that have expired
      const awaitingApprovalQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', OrderStatus.AWAITING_APPROVAL),
        where('expiresAt', '<=', now)
      );

      // Get orders awaiting payment that have expired
      const awaitingPaymentQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', OrderStatus.AWAITING_PAYMENT),
        where('paymentDueAt', '<=', now)
      );

      const [approvalDocs, paymentDocs] = await Promise.all([
        getDocs(awaitingApprovalQuery),
        getDocs(awaitingPaymentQuery)
      ]);

      const expiredOrders: Order[] = [];
      
      approvalDocs.forEach(doc => {
        expiredOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      
      paymentDocs.forEach(doc => {
        expiredOrders.push({ id: doc.id, ...doc.data() } as Order);
      });

      return expiredOrders;
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

      const batch = writeBatch(db);
      const now = Timestamp.now();

      expiredOrders.forEach(order => {
        const orderRef = doc(db, this.COLLECTION_NAME, order.id);
        batch.update(orderRef, {
          status: OrderStatus.EXPIRED,
          updatedAt: now,
          cancellationReason: 'Order expired automatically'
        });
      });

      await batch.commit();

      // Create status updates for all expired orders
      for (const order of expiredOrders) {
        await this.createStatusUpdate(
          order.id, 
          OrderStatus.EXPIRED, 
          'Order expired automatically', 
          'system'
        );
      }

      return expiredOrders.length;
    } catch (error) {
      console.error('Error cleaning up expired orders:', error);
      throw new Error('Failed to cleanup expired orders');
    }
  }
}