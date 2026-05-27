export enum OrderStatus {
  AWAITING_APPROVAL = 'awaiting_approval',
  AWAITING_PAYMENT = 'awaiting_payment', 
  CASH_PAYMENT = 'cash_payment',
  PAYMENT_RECEIVED = 'payment_received',
  FROZEN = 'frozen',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum PaymentMethod {
  CARD = 'card',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer'
}

export interface OrderItem {
  id: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vendorId: string;
  vendorName: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  
  // Order details
  items: OrderItem[];
  subtotal: number;
  platformFee: number; // 8% of subtotal
  totalAmount: number;
  
  // Status and workflow
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  
  // Vendor management
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  paymentDueAt?: Date; // 7 days after approval for online payments
  expiresAt?: Date; // 30 days after creation for approval
  returnWindowHours?: number; // Vendor-configured return window
  lateFeePerDay?: number; // Vendor-configured late fee per day
  returnDueAt?: Date;
  completedAt?: Date;
  lateFeeAmount?: number;
  returnedAt?: Date;
  
  // Payment details
  paymentId?: string;
  paymentReference?: string;
  paymentAmount?: number;
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'cancelled';
  
  // QR Code for completion and payout release
  qrCode?: string;
  qrCodeExpiresAt?: Date; // 120 seconds after generation
  qrCodeGeneratedAt?: Date;
  
  // Payout freeze/release tracking
  payoutFrozen?: boolean;
  payoutReleasedAt?: Date;
  vendorPayoutAmount?: number;
  platformCommission?: number;
  
  // Additional fields
  notes?: string;
  cancellationReason?: string;
  vendorApprovalNotes?: string;
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  notes?: string;
  updatedBy: string;
  timestamp: Date;
}

// Helper function to calculate order totals
export function calculateOrderTotals(items: OrderItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const platformFee = subtotal * 0.08; // 8% platform fee
  const totalAmount = subtotal + platformFee;
  
  return {
    subtotal,
    platformFee,
    totalAmount
  };
}

// Helper function to calculate payout split (5% platform commission on total)
export function calculatePayoutSplit(totalAmount: number) {
  const platformCommission = totalAmount * 0.05; // 5% platform commission on total payment
  const vendorPayoutAmount = totalAmount - platformCommission;

  return {
    platformCommission,
    vendorPayoutAmount,
    totalAmount
  };
}

// Helper function to check if order is expired
export function isOrderExpired(order: Order): boolean {
  const now = new Date();

  switch (order.status) {
    case OrderStatus.AWAITING_APPROVAL:
      return order.expiresAt ? order.expiresAt < now : false;
    case OrderStatus.AWAITING_PAYMENT:
      return order.paymentDueAt ? order.paymentDueAt < now : false;
    default:
      return false;
  }
}

// Helper function to get order status display text
export function getOrderStatusDisplay(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.AWAITING_APPROVAL:
      return 'Awaiting Approval';
    case OrderStatus.AWAITING_PAYMENT:
      return 'Awaiting Payment';
    case OrderStatus.CASH_PAYMENT:
      return 'Cash Payment';
    case OrderStatus.PAYMENT_RECEIVED:
      return 'Payment Received';
    case OrderStatus.COMPLETED:
      return 'Completed';
    case OrderStatus.CANCELLED:
      return 'Cancelled';
    case OrderStatus.EXPIRED:
      return 'Expired';
    default:
      return status;
  }
}

// Helper function to get next possible statuses
export function getNextPossibleStatuses(currentStatus: OrderStatus): OrderStatus[] {
  switch (currentStatus) {
    case OrderStatus.AWAITING_APPROVAL:
      return [OrderStatus.AWAITING_PAYMENT, OrderStatus.CASH_PAYMENT, OrderStatus.CANCELLED];
    case OrderStatus.AWAITING_PAYMENT:
      return [OrderStatus.PAYMENT_RECEIVED, OrderStatus.CANCELLED];
    case OrderStatus.CASH_PAYMENT:
      return [OrderStatus.PAYMENT_RECEIVED, OrderStatus.CANCELLED];
    case OrderStatus.PAYMENT_RECEIVED:
      return [OrderStatus.COMPLETED];
    default:
      return [];
  }
}
