import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Order, OrderStatus, PaymentMethod } from '../types/order';
import { OrderService } from '../lib/order-service';
import { CreditCardIcon, BanknotesIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

// Helper function for currency formatting
const formatCurrency = (amount: number): string => {
  return `R${amount.toFixed(2)}`;
};

interface PaymentFlowProps {
  order: Order;
  onPaymentComplete: () => void;
}

const PaymentFlow: React.FC<PaymentFlowProps> = ({ order, onPaymentComplete }) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod);
  const [showPayFastForm, setShowPayFastForm] = useState(false);

  const handlePayFastPayment = async () => {
    try {
      setLoading(true);
      
      // Generate PayFast payment form
      const paymentData = {
        merchant_id: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID,
        merchant_key: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY,
        amount: order.totalAmount.toFixed(2),
        item_name: `Order #${order.id.slice(-8)}`,
        item_description: `${order.items.length} item(s) from ${order.vendorName}`,
        email_address: order.userEmail,
        payment_method: 'cc,dc,eft',
        return_url: `${window.location.origin}/payment/success?orderId=${order.id}`,
        cancel_url: `${window.location.origin}/payment/cancel?orderId=${order.id}`,
        notify_url: `${window.location.origin}/api/payment/payfast-notify`,
        name_first: order.userName.split(' ')[0] || order.userName,
        name_last: order.userName.split(' ').slice(1).join(' ') || '',
        custom_str1: order.id,
        custom_str2: order.vendorId,
      };

      // Create form and submit to PayFast
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = process.env.NODE_ENV === 'production' 
        ? 'https://www.payfast.co.za/eng/process' 
        : 'https://sandbox.payfast.co.za/eng/process';

      Object.entries(paymentData).forEach(([key, value]) => {
        if (value) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value.toString();
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
      
    } catch (error) {
      console.error('Error processing PayFast payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = async () => {
    try {
      setLoading(true);
      
      // For cash payments, we just update the order status
      // The vendor will handle the actual cash collection
      await OrderService.markPaymentReceived(
        order.id,
        `cash_${Date.now()}`,
        'Cash payment confirmed',
        order.totalAmount,
        session?.user?.id || 'user'
      );
      
      onPaymentComplete();
      
    } catch (error) {
      console.error('Error confirming cash payment:', error);
      alert('Failed to confirm cash payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentDueStatus = () => {
    if (!order.paymentDueAt) return null;
    
    const dueDate = order.paymentDueAt.toDate();
    const now = new Date();
    const hoursUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursUntilDue <= 0) {
      return { text: 'Payment overdue', color: 'text-red-600', urgent: true };
    } else if (hoursUntilDue <= 24) {
      return { text: `Payment due in ${hoursUntilDue} hours`, color: 'text-orange-600', urgent: true };
    } else {
      const days = Math.ceil(hoursUntilDue / 24);
      return { text: `Payment due in ${days} days`, color: 'text-gray-600', urgent: false };
    }
  };

  const paymentDueStatus = getPaymentDueStatus();

  if (order.status === OrderStatus.PAYMENT_RECEIVED) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CreditCardIcon className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Payment Received
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>Your payment has been received. You can now collect your order.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (order.status === OrderStatus.COMPLETED) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              Order Completed
            </h3>
            <div className="mt-2 text-sm text-gray-700">
              <p>This order has been completed successfully.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (order.status !== OrderStatus.AWAITING_PAYMENT && order.status !== OrderStatus.CASH_PAYMENT) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Waiting for Vendor Approval
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Your order is pending vendor approval. You'll be notified when you can make payment.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Due Status */}
      {paymentDueStatus && (
        <div className={`bg-white border rounded-md p-4 ${paymentDueStatus.urgent ? 'border-orange-200' : 'border-gray-200'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <ClockIcon className={`h-5 w-5 ${paymentDueStatus.urgent ? 'text-orange-400' : 'text-gray-400'}`} />
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${paymentDueStatus.color}`}>
                {paymentDueStatus.urgent && '⚠️ '}{paymentDueStatus.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee (8%):</span>
            <span>{formatCurrency(order.platformFee)}</span>
          </div>
          <div className="flex justify-between font-medium border-t pt-2">
            <span>Total Amount:</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
        
        <div className="space-y-3">
          {order.paymentMethod === PaymentMethod.CASH ? (
            <div className="flex items-center p-3 border-2 border-purple-200 bg-purple-50 rounded-md">
              <BanknotesIcon className="h-6 w-6 text-purple-600 mr-3" />
              <div className="flex-1">
                <h4 className="font-medium text-purple-900">Cash Payment</h4>
                <p className="text-sm text-purple-700">Pay with cash when collecting the item</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center p-3 border-2 border-blue-200 bg-blue-50 rounded-md">
                <CreditCardIcon className="h-6 w-6 text-blue-600 mr-3" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">Online Payment</h4>
                  <p className="text-sm text-blue-700">Pay securely with card or EFT via PayFast</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Actions */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Payment</h3>
        
        {order.paymentMethod === PaymentMethod.CASH ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please confirm that you understand you will pay {formatCurrency(order.totalAmount)} in cash when collecting your items.
            </p>
            <button
              onClick={handleCashPayment}
              disabled={loading}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Confirm Cash Payment
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You will be redirected to PayFast to complete your payment of {formatCurrency(order.totalAmount)}.
            </p>
            <button
              onClick={handlePayFastPayment}
              disabled={loading}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Pay with PayFast
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Payment Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-xs text-gray-600">
          <strong>Secure Payment:</strong> All online payments are processed securely through PayFast. 
          Your payment information is encrypted and protected. For cash payments, you only pay when 
          collecting your items.
        </p>
      </div>
    </div>
  );
};

export default PaymentFlow;