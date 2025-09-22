import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Order, OrderStatus } from '../types/order';
import { OrderService } from '../lib/order-service';
import { QrCodeIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface QRCodeComponentProps {
  order: Order;
  onOrderComplete?: () => void;
}

const QRCodeComponent: React.FC<QRCodeComponentProps> = ({ order, onOrderComplete }) => {
  const { data: session } = useSession();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user can generate QR code
  const canGenerateQR = order.status === OrderStatus.PAYMENT_RECEIVED && 
                       order.userId === session?.user?.id;

  // Check if vendor can scan QR code
  const canScanQR = order.vendorId === session?.user?.id &&
                   order.status === OrderStatus.PAYMENT_RECEIVED;

  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (!isClient) return;
    
    // If order already has an active QR code, set it and start countdown
    if (order.qrCode && order.qrCodeExpiresAt) {
      const expiryTime = order.qrCodeExpiresAt.toDate().getTime();
      const now = Date.now();
      
      if (expiryTime > now) {
        setQrCode(order.qrCode);
        setTimeRemaining(Math.ceil((expiryTime - now) / 1000));
      }
    }
  }, [order, isClient]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setQrCode(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRemaining]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const qrData = await OrderService.generateQRCode(order.id, session?.user?.id || '');
      setQrCode(qrData);
      setTimeRemaining(120); // 2 minutes
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scanQRCode = async (qrData: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await OrderService.completeOrderWithQR(qrData, session?.user?.id || '');
      
      if (onOrderComplete) {
        onOrderComplete();
      }
      
    } catch (error) {
      console.error('Error completing order with QR code:', error);
      setError('Failed to complete order. Please check the QR code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (order.status === OrderStatus.COMPLETED) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Order Completed
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>This order has been completed successfully.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (order.status !== OrderStatus.PAYMENT_RECEIVED) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              QR Code Not Available
            </h3>
            <div className="mt-2 text-sm text-gray-700">
              <p>QR code will be available once payment is confirmed.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* QR Code Generation (Customer View) */}
      {canGenerateQR && (
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Generate QR Code for Collection
          </h3>
          
          {!qrCode ? (
            <div className="text-center">
              <QrCodeIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Generate a QR code to show the vendor for order completion.
                The QR code will expire after 2 minutes for security.
              </p>
              <button
                onClick={generateQRCode}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCodeIcon className="h-4 w-4 mr-2" />
                    Generate QR Code
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-4 inline-block">
                <div className="text-xs font-mono break-all bg-gray-100 p-3 rounded">
                  {qrCode}
                </div>
              </div>
              
              <div className="flex items-center justify-center mb-4">
                <ClockIcon className="h-4 w-4 text-orange-500 mr-2" />
                <span className="text-sm font-medium text-orange-600">
                  Expires in: {formatTime(timeRemaining)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Show this QR code to the vendor to complete your order.
              </p>
              
              <button
                onClick={generateQRCode}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Generate New Code
              </button>
            </div>
          )}
        </div>
      )}

      {/* QR Code Scanning (Vendor View) */}
      {canScanQR && (
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Complete Order with QR Code
          </h3>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Ask the customer to generate and show their QR code, then enter it below to complete the order.
            </p>
            
            <div>
              <label htmlFor="qr-input" className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Data
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="qr-input"
                  placeholder="Enter or scan QR code data..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value;
                      if (value.trim()) {
                        scanQRCode(value.trim());
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('qr-input') as HTMLInputElement;
                    const value = input.value.trim();
                    if (value) {
                      scanQRCode(value);
                    }
                  }}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Complete Order
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> QR codes expire after 2 minutes for security. 
                If the code is expired, ask the customer to generate a new one.
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Order Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Order ID: #{order.id.slice(-8)}</p>
          <p>Customer: {order.userName}</p>
          <p>Items: {order.items.length}</p>
          <p>Total: R{order.totalAmount.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeComponent;