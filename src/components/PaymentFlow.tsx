import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Order, OrderStatus, PaymentMethod } from '../types/order';
import { OrderService } from '../lib/order-service';
import { CreditCardIcon, BanknotesIcon, ClockIcon, CheckCircleIcon, QrCodeIcon, ArrowPathIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

// Helper function for currency formatting
const formatCurrency = (amount: number): string => {
  return `R${amount.toFixed(2)}`;
};

interface PaymentFlowProps {
  order: Order;
  onPaymentComplete: () => void;
}

const PaymentFlow: React.FC<PaymentFlowProps> = ({ order, onPaymentComplete }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [paymentMethod] = useState<PaymentMethod>(order.paymentMethod);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletChecking, setWalletChecking] = useState(true);
  const [walletAvailable, setWalletAvailable] = useState<number | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cash payment QR flow state
  const [cashStep, setCashStep] = useState<'initiate' | 'qr' | 'complete'>('initiate');
  const [cashQR, setCashQR] = useState<{ qrData: string; qrImage: string } | null>(null);
  const [cashQRTime, setCashQRTime] = useState<number>(0);

  // Fetch wallet summary to know if we can offer wallet payment
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setWalletChecking(true);
        const res = await fetch('/api/wallet', { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error('Failed to load wallet');
        const data = await res.json();
        const available = data?.summary?.available ?? data?.available ?? null;
        setWalletAvailable(typeof available === 'number' ? available : null);
      } catch (e: any) {
        setWalletError(e.message || 'Wallet unavailable');
      } finally {
        setWalletChecking(false);
      }
    };
    fetchWallet();
  }, [order.id]);

  const handleWalletPayment = async () => {
    if (walletLoading) return; // double-click guard
    if (!walletAvailable || walletAvailable < order.totalAmount) return;
    try {
      setWalletLoading(true);
      const res = await fetch('/api/wallet/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Wallet payment failed');
      // Notify parent (should trigger order refetch -> status PAYMENT_RECEIVED)
      onPaymentComplete();
    } catch (e: any) {
      alert(e.message || 'Wallet payment failed');
    } finally {
      setWalletLoading(false);
    }
  };

  const handlePayFastPayment = async () => {
    try {
      if (loading) return; // double-click guard
      setLoading(true);
      
      // Calculate split: 5% platform commission, 95% vendor payout
      const platformCommission = order.totalAmount * 0.05;
      const vendorPayout = order.totalAmount - platformCommission;

      // Generate PayFast payment form with split payment data
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
        // Custom fields for split payment tracking
        custom_str1: order.id,     // Order ID
        custom_str2: order.userId,  // Renter ID
        custom_str3: order.vendorId, // Vendor ID
        // Split amounts in cents for PayFast ITN verification
        custom_int1: String(Math.round(platformCommission * 100)), // Platform commission (5%)
        custom_int2: String(Math.round(vendorPayout * 100)),       // Vendor payout (95%)
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

  /**
   * Initiate cash payment (creates pending record, does NOT mark as PAID).
   * After initiation, the buyer generates a QR code and shows it to the vendor
   * who scans it to confirm cash receipt.
   */
  const handleCashPaymentInitiate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/payment/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: order.id, amount: order.totalAmount }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to initiate cash payment');
      }
      setCashStep('qr');
    } catch (err) {
      console.error('Error initiating cash payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate cash payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate the cash payment confirmation QR code for the buyer.
   */
  const handleGenerateCashQR = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/payment/cash/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: order.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate QR code');
      }
      const data = await res.json();

      // Generate QR code image
      let qrImage = '';
      try {
        const QRCodeLib = await import('qrcode');
        qrImage = await QRCodeLib.toDataURL(data.qrData, {
          width: 256,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
      } catch (e) {
        console.error('QR image generation error:', e);
      }

      setCashQR({ qrData: data.qrData, qrImage });
      setCashQRTime(120);
    } catch (err) {
      console.error('Error generating cash payment QR:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate QR code.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for cash QR code
  useEffect(() => {
    if (cashQRTime <= 0) return;
    const interval = setInterval(() => {
      setCashQRTime(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cashQRTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPaymentDueStatus = () => {
    if (!order.paymentDueAt) return null;
    
    const dueDate = new Date(order.paymentDueAt);
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

  // Show CASH_PAYMENT_PENDING status section
  if (order.status === OrderStatus.CASH_PAYMENT_PENDING) {
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-5 w-5 text-purple-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">
                Cash Payment Pending
              </h3>
              <div className="mt-2 text-sm text-purple-700">
                <p>Generate a QR code and show it to the vendor when you meet in person.</p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Generation Section */}
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <QrCodeIcon className="h-5 w-5 mr-2 text-purple-600" />
            Cash Payment QR Code
          </h3>

          {!cashQR ? (
            <div className="text-center">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                <QrCodeIcon className="mx-auto h-20 w-20 text-gray-300 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Generate a QR code to show the vendor after paying cash.
                  The QR code will expire after <strong>120 seconds</strong> for security.
                </p>
              </div>
              <button
                onClick={handleGenerateCashQR}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCodeIcon className="h-5 w-5 mr-2" />
                    Generate QR Code
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center">
              {/* QR Code Image */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-4 inline-block shadow-sm">
                {cashQR.qrImage ? (
                  <Image
                    src={cashQR.qrImage}
                    alt="Cash Payment QR Code"
                    width={256}
                    height={256}
                    className="rounded-lg"
                    priority
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-xs font-mono break-all bg-gray-200 p-4 rounded max-w-[240px] max-h-[240px] overflow-hidden">
                      {cashQR.qrData}
                    </div>
                  </div>
                )}
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center mb-3">
                <ClockIcon className={`h-5 w-5 mr-2 ${cashQRTime <= 30 ? 'text-red-500' : 'text-orange-500'}`} />
                <span className={`text-lg font-bold ${cashQRTime <= 30 ? 'text-red-600' : 'text-orange-600'}`}>
                  {formatTime(cashQRTime)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    cashQRTime <= 30 ? 'bg-red-500' : cashQRTime <= 60 ? 'bg-orange-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${(cashQRTime / 120) * 100}%` }}
                />
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Show this QR code to the vendor after paying cash.
                The vendor will scan it to confirm your payment.
                {cashQRTime <= 30 && (
                  <span className="text-red-600 font-medium block mt-1">
                    QR code is about to expire!
                  </span>
                )}
              </p>

              <button
                onClick={handleGenerateCashQR}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Generate New Code
              </button>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Instructions:</strong>
                  <br />1. Meet the vendor in person
                  <br />2. Pay the cash amount: <strong>{formatCurrency(order.totalAmount)}</strong>
                  <br />3. Show this QR code to the vendor
                  <br />4. Vendor scans it to confirm receipt
                  <br />5. Your order will be marked as completed
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
              By clicking below, you confirm you intend to pay {formatCurrency(order.totalAmount)} in cash.
              You will generate a QR code to show to the vendor when you meet in person.
              The vendor will scan your QR to confirm they received the cash.
            </p>
            <button
              onClick={handleCashPaymentInitiate}
              disabled={loading}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Initiating...
                </>
              ) : (
                <>
                  <BanknotesIcon className="h-5 w-5 mr-2" />
                  Initiate Cash Payment
                </>
              )}
            </button>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You will be redirected to PayFast to complete your payment of {formatCurrency(order.totalAmount)}.
            </p>
            {/* Wallet Payment Option */}
            {walletChecking ? (
              <div className="text-xs text-gray-500">Checking wallet balance...</div>
            ) : walletError ? (
              <div className="text-xs text-red-500">{walletError}</div>
            ) : walletAvailable !== null && walletAvailable >= order.totalAmount ? (
              <button
                onClick={handleWalletPayment}
                disabled={walletLoading}
                className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {walletLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Paying...
                  </>
                ) : (
                  <>
                    <BanknotesIcon className="h-5 w-5 mr-2" />
                    Pay with Wallet (Balance {formatCurrency(walletAvailable)})
                  </>
                )}
              </button>
            ) : walletAvailable !== null ? (
              <div className="text-xs text-gray-500">
                Wallet balance {formatCurrency(walletAvailable || 0)} insufficient for total {formatCurrency(order.totalAmount)}.
              </div>
            ) : null}
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