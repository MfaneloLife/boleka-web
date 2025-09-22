import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import VisionScanner from './VisionScanner';
import { OrderService } from '../lib/order-service';
import { QrCodeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface QRScannerProps {
  onOrderComplete?: (orderId: string) => void;
  className?: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ onOrderComplete, className = '' }) => {
  const { data: session } = useSession();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; orderId?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQRCodeDetected = async (qrCode: string) => {
    try {
      setLoading(true);
      setResult(null);

      // Try to parse and validate the QR code
      let qrData;
      try {
        qrData = JSON.parse(qrCode);
      } catch {
        // If it's not JSON, treat it as plain text
        setResult({
          success: false,
          message: 'Invalid QR code format. Please scan a valid order QR code.'
        });
        return;
      }

      // Validate QR code structure
      if (!qrData.orderId || !qrData.userId || !qrData.vendorId) {
        setResult({
          success: false,
          message: 'Invalid QR code structure. Missing required fields.'
        });
        return;
      }

      // Check if the vendor ID matches the current user
      if (qrData.vendorId !== session?.user?.id) {
        setResult({
          success: false,
          message: 'This QR code is not for your orders.'
        });
        return;
      }

      // Complete the order
      if (!session?.user?.id) {
        setResult({
          success: false,
          message: 'Authentication required'
        });
        return;
      }
      
      await OrderService.completeOrderWithQR(qrCode, session.user.id);

      setResult({
        success: true,
        message: `Order #${qrData.orderId.slice(-8)} completed successfully!`,
        orderId: qrData.orderId
      });

      if (onOrderComplete) {
        onOrderComplete(qrData.orderId);
      }

    } catch (error) {
      console.error('Error processing QR code:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          setResult({
            success: false,
            message: 'QR code has expired. Please ask the customer to generate a new one.'
          });
        } else if (error.message.includes('not found')) {
          setResult({
            success: false,
            message: 'Order not found. Please check the QR code.'
          });
        } else if (error.message.includes('Invalid QR code')) {
          setResult({
            success: false,
            message: 'Invalid QR code. Please ask the customer to generate a new one.'
          });
        } else {
          setResult({
            success: false,
            message: error.message
          });
        }
      } else {
        setResult({
          success: false,
          message: 'Failed to process QR code. Please try again.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setResult(null);
  };

  const stopScanning = () => {
    setScanning(false);
    setResult(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-md p-6">
        <div className="text-center mb-4">
          <QrCodeIcon className="mx-auto h-12 w-12 text-blue-600 mb-2" />
          <h3 className="text-lg font-medium text-gray-900">QR Code Scanner</h3>
          <p className="text-sm text-gray-600">
            Scan customer QR codes to complete orders
          </p>
        </div>

        {!scanning ? (
          <div className="text-center">
            <button
              onClick={startScanning}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <QrCodeIcon className="h-4 w-4 mr-2" />
              Start QR Scanner
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <VisionScanner
              mode="qr"
              onQRCodeDetected={handleQRCodeDetected}
              className="border-t border-gray-200 pt-4"
            />
            
            <div className="text-center">
              <button
                onClick={stopScanning}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Stop Scanning
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Processing QR code...</span>
          </div>
        )}

        {result && (
          <div className={`mt-4 p-4 rounded-md border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                <div className={`mt-2 text-sm ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  <p>{result.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs text-blue-800">
            <strong>Instructions:</strong>
            <br />• Ask the customer to show their QR code on their phone
            <br />• QR codes expire after 2 minutes for security
            <br />• If expired, ask customer to generate a new QR code
            <br />• Only scan QR codes from customers who have paid
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;