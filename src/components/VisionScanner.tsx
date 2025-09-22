import React, { useState, useRef } from 'react';
import { CameraIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface BarcodeResult {
  text: string;
  format: string;
  confidence: number;
}

interface VisionScannerProps {
  onBarcodeDetected?: (barcode: BarcodeResult) => void;
  onQRCodeDetected?: (qrCode: string) => void;
  onImageLabels?: (labels: string[]) => void;
  mode: 'barcode' | 'qr' | 'labels';
  className?: string;
}

const VisionScanner: React.FC<VisionScannerProps> = ({
  onBarcodeDetected,
  onQRCodeDetected,
  onImageLabels,
  mode,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string)?.split(',')[1];
        
        if (!base64) {
          throw new Error('Failed to process image');
        }

        // Call Firebase Vision API
        const response = await fetch('/api/vision/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,
            mode: mode
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze image');
        }

        const data = await response.json();

        switch (mode) {
          case 'barcode':
            if (data.barcodes && data.barcodes.length > 0) {
              const barcode = data.barcodes[0];
              setResult(`Barcode: ${barcode.text} (${barcode.format})`);
              if (onBarcodeDetected) {
                onBarcodeDetected(barcode);
              }
            } else {
              setResult('No barcodes detected');
            }
            break;

          case 'qr':
            if (data.qrCodes && data.qrCodes.length > 0) {
              const qrCode = data.qrCodes[0];
              setResult(`QR Code: ${qrCode}`);
              if (onQRCodeDetected) {
                onQRCodeDetected(qrCode);
              }
            } else {
              setResult('No QR codes detected');
            }
            break;

          case 'labels':
            if (data.labels && data.labels.length > 0) {
              const labelTexts = data.labels.map((label: any) => label.description);
              setResult(`Labels: ${labelTexts.join(', ')}`);
              if (onImageLabels) {
                onImageLabels(labelTexts);
              }
            } else {
              setResult('No labels detected');
            }
            break;
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Error processing image:', error);
      setError(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      processImage(file);
    }
  };

  const handleCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getModeText = () => {
    switch (mode) {
      case 'barcode':
        return 'Scan Barcode';
      case 'qr':
        return 'Scan QR Code';
      case 'labels':
        return 'Analyze Image';
      default:
        return 'Scan';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'barcode':
        return 'Take a photo of a barcode to read its data';
      case 'qr':
        return 'Take a photo of a QR code to read its content';
      case 'labels':
        return 'Take a photo to identify objects and labels';
      default:
        return 'Analyze image content';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {getModeText()}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {getModeDescription()}
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
          aria-label="Select image to scan"
        />

        <button
          onClick={handleCapture}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <CameraIcon className="h-4 w-4 mr-2" />
              {getModeText()}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
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

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <DocumentMagnifyingGlassIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Result</h3>
              <div className="mt-2 text-sm text-green-700">
                <p className="break-all">{result}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> This feature uses Firebase ML Vision API to analyze images. 
          Make sure the image is clear and well-lit for best results.
        </p>
      </div>
    </div>
  );
};

export default VisionScanner;