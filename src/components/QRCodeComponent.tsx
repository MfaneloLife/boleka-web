'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { Order, OrderStatus } from '../types/order';
import { QrCodeIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Dynamically import qrcode for client-side generation
let QRCodeLib: any = null;

interface QRCodeComponentProps {
  order: Order;
  onOrderComplete?: () => void;
}

const QRCodeComponent: React.FC<QRCodeComponentProps> = ({ order, onOrderComplete }) => {
  const { user } = useUser();
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user can generate QR code (renter)
  const canGenerateQR = order.status === OrderStatus.PAYMENT_RECEIVED && 
                       order.userId === user?.id;

  // Check if vendor can scan QR code
  const canScanQR = order.vendorId === user?.id &&
                   order.status === OrderStatus.PAYMENT_RECEIVED;

  // Generate QR code image from data string
  const generateQRImage = useCallback(async (data: string) => {
    try {
      if (!QRCodeLib) {
        QRCodeLib = await import('qrcode');
      }
      const dataUrl = await QRCodeLib.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrImage(dataUrl);
    } catch (err) {
      console.error('Error generating QR image:', err);
      // Fallback: show text representation
      setQrImage(null);
    }
  }, []);

  // Start countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timeRemaining > 0 && isClient) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setQrData(null);
            setQrImage(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeRemaining, isClient]);

  // Check if order already has active QR code data
  useEffect(() => {
    if (!isClient) return;
    
    // If the order object has qrCode that hasn't expired, restore it
    // This is handled via the stored Booking.qrCode field
  }, [order, isClient]);

  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/orders/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate QR code');
      
      setQrData(data.qrData);
      setTimeRemaining(120); // 2 minutes
      
      // Generate the QR code image from the data
      await generateQRImage(data.qrData);
      
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = async (qrInput: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/orders/qr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: qrInput })
      });
      
      const scanData = await res.json();
      if (!res.ok) throw new Error(scanData.error || 'Failed to complete order');
      
      if (onOrderComplete) {
        onOrderComplete();
      }
      
    } catch (err) {
      console.error('Error completing order with QR code:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete order. Please check the QR code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ COMPLETED state
  if (order.status === OrderStatus.COMPLETED) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Order Completed</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>This order has been completed successfully via QR scan.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🚫 Not in PAYMENT_RECEIVED state
  if (order.status !== OrderStatus.PAYMENT_RECEIVED) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ClockIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">QR Code Not Available</h3>
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
      {/* 📱 Renter View: Generate & Show QR Code */}
      {canGenerateQR && (
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <QrCodeIcon className="h-5 w-5 mr-2 text-blue-600" />
            Show QR Code to Vendor
          </h3>
          
          {!qrData ? (
            <div className="text-center">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                <QrCodeIcon className="mx-auto h-20 w-20 text-gray-300 mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Generate a QR code to show the vendor for order completion.
                  The QR code will expire after <strong>120 seconds</strong> for security.
                </p>
              </div>
              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
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
                {qrImage ? (
                  <Image
                    src={qrImage}
                    alt="Order QR Code"
                    width={256}
                    height={256}
                    className="rounded-lg"
                    priority
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-xs font-mono break-all bg-gray-200 p-4 rounded max-w-[240px] max-h-[240px] overflow-hidden">
                      {qrData}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Timer */}
              <div className="flex items-center justify-center mb-3">
                <ClockIcon className={`h-5 w-5 mr-2 ${timeRemaining <= 30 ? 'text-red-500' : 'text-orange-500'}`} />
                <span className={`text-lg font-bold ${timeRemaining <= 30 ? 'text-red-600' : 'text-orange-600'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    timeRemaining <= 30 ? 'bg-red-500' : timeRemaining <= 60 ? 'bg-orange-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${(timeRemaining / 120) * 100}%` }}
                />
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Show this QR code to the vendor to complete your order.
                {timeRemaining <= 30 && (
                  <span className="text-red-600 font-medium block mt-1">
                    ⚠️ QR code is about to expire!
                  </span>
                )}
              </p>
              
              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Generate New Code
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🏪 Vendor View: Scan QR Code */}
      {canScanQR && (
        <div className="bg-white border border-gray-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <QrCodeIcon className="h-5 w-5 mr-2 text-green-600" />
            Complete Order with QR Code
          </h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Ask the customer to show their QR code, then paste the data below 
                to complete the order and trigger the payout split (95% vendor / 5% platform commission).
              </p>
            </div>
            
            <div>
              <label htmlFor="qr-input" className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Data
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="qr-input"
                  placeholder="Paste QR code data here..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value;
                      if (value.trim()) {
                        handleScanQR(value.trim());
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('qr-input') as HTMLInputElement;
                    if (input?.value?.trim()) {
                      handleScanQR(input.value.trim());
                    }
                  }}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
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
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-800 flex items-start">
                <ClockIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                QR codes expire after <strong className="mx-1">120 seconds</strong> for security. 
                If the code is expired, the API will reject it and the customer must generate a new one.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ Error Display */}
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

      {/* 📋 Order Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Order ID</span>
            <span className="font-mono">#{order.id.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer</span>
            <span>{order.userName}</span>
          </div>
          <div className="flex justify-between">
            <span>Vendor</span>
            <span>{order.vendorName}</span>
          </div>
          <div className="flex justify-between">
            <span>Items</span>
            <span>{order.items.length}</span>
          </div>
          <hr className="my-1" />
          <div className="flex justify-between font-medium">
            <span>Total Paid</span>
            <span>R{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Platform Fee (5%)</span>
            <span>R{(order.totalAmount * 0.05).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Vendor Payout (95%)</span>
            <span>R{(order.totalAmount * 0.95).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeComponent;
