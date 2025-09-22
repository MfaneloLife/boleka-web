import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5QrcodeResult } from 'html5-qrcode';
import { 
  CameraIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface MLBarcodeResult {
  type: string;
  data: string;
  format: string;
  confidence?: number;
  extractedText?: string;
  imageLabels?: string[];
}

interface MLBarcodeScannerProps {
  onBarcodeScanned?: (result: MLBarcodeResult) => void;
  onTextExtracted?: (text: string) => void;
  onLabelsDetected?: (labels: string[]) => void;
  onError?: (error: string) => void;
  enableTextExtraction?: boolean;
  enableImageLabeling?: boolean;
  enableBarcodeScanning?: boolean;
  className?: string;
}

const MLBarcodeScanner: React.FC<MLBarcodeScannerProps> = ({
  onBarcodeScanned,
  onTextExtracted,
  onLabelsDetected,
  onError,
  enableTextExtraction = true,
  enableImageLabeling = true,
  enableBarcodeScanning = true,
  className = ''
}) => {
  const { data: session } = useSession();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<MLBarcodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'barcode' | 'text' | 'image'>('barcode');
  const [lastScanResults, setLastScanResults] = useState<{
    barcodes: any[];
    text: string;
    labels: string[];
  }>({ barcodes: [], text: '', labels: [] });
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setScanning(true);
      setResult(null);

      if (scannerRef.current) {
        await scannerRef.current.clear();
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      };

      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        config,
        false
      );

      scannerRef.current.render(
        (decodedText: string, result: Html5QrcodeResult) => {
          handleScanSuccess(decodedText, result);
        },
        (error: string) => {
          // Handle scan errors silently for better UX
          console.warn('Scan error:', error);
        }
      );

    } catch (error) {
      console.error('Error starting scanner:', error);
      setScanning(false);
      onError?.('Failed to start camera scanner');
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setScanning(false);
    } catch (error) {
      console.error('Error stopping scanner:', error);
      setScanning(false);
    }
  };

  const handleScanSuccess = async (decodedText: string, scanResult: Html5QrcodeResult) => {
    try {
      setLoading(true);
      await stopScanning();

      // Process the scanned data with ML Vision
      const mlResult = await processWithMLVision(decodedText, scanResult);
      
      setResult(mlResult);
      onBarcodeScanned?.(mlResult);
      
      // Save to user's scan history
      if (session?.user?.id) {
        await saveScanToHistory(mlResult);
      }

    } catch (error) {
      console.error('Error processing scan:', error);
      onError?.('Failed to process scanned data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      
      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append('userId', session?.user?.id || 'anonymous');
      formData.append('enableBarcodeScanning', enableBarcodeScanning.toString());
      formData.append('enableTextExtraction', enableTextExtraction.toString());
      formData.append('enableImageLabeling', enableImageLabeling.toString());

      // Send to ML Vision API
      const response = await fetch('/api/ml-vision/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const analysisResult = await response.json();
      
      // Update UI with results
      setLastScanResults({
        barcodes: analysisResult.barcodes || [],
        text: analysisResult.textExtraction?.extractedText || '',
        labels: analysisResult.labels?.map((l: any) => l.description) || []
      });

      // Trigger callbacks
      if (analysisResult.barcodes?.length > 0) {
        const barcode = analysisResult.barcodes[0];
        const mlResult: MLBarcodeResult = {
          type: barcode.type,
          data: barcode.data,
          format: barcode.format,
          confidence: barcode.confidence,
          extractedText: analysisResult.textExtraction?.extractedText,
          imageLabels: analysisResult.labels?.map((l: any) => l.description)
        };
        onBarcodeScanned?.(mlResult);
      }

      if (analysisResult.textExtraction?.extractedText) {
        onTextExtracted?.(analysisResult.textExtraction.extractedText);
      }

      if (analysisResult.labels?.length > 0) {
        const labels = analysisResult.labels.map((l: any) => l.description);
        onLabelsDetected?.(labels);
      }

    } catch (error) {
      console.error('Error analyzing image:', error);
      onError?.('Failed to analyze uploaded image');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processWithMLVision = async (data: string, scanResult: any): Promise<MLBarcodeResult> => {
    // For now, return basic barcode result
    // In a real implementation, you might want to enhance this with additional ML analysis
    return {
      type: 'QR_CODE',
      data,
      format: scanResult.decodedText ? 'QR' : 'UNKNOWN',
      confidence: 0.95
    };
  };

  const saveScanToHistory = async (result: MLBarcodeResult): Promise<void> => {
    try {
      await fetch('/api/ml-vision/barcode-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          ...result,
          scannedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error saving scan to history:', error);
    }
  };

  return (
    <div className={`ml-barcode-scanner ${className}`}>
      {/* Mode Selection */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setScanMode('barcode')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            scanMode === 'barcode' 
              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <TagIcon className="h-4 w-4 mr-1" />
          Barcode
        </button>
        
        <button
          onClick={() => setScanMode('text')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            scanMode === 'text' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <DocumentTextIcon className="h-4 w-4 mr-1" />
          Text
        </button>
        
        <button
          onClick={() => setScanMode('image')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
            scanMode === 'image' 
              ? 'bg-purple-100 text-purple-700 border border-purple-300' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <PhotoIcon className="h-4 w-4 mr-1" />
          Labels
        </button>
      </div>

      {/* Scanner Controls */}
      <div className="flex space-x-3 mb-4">
        {!scanning ? (
          <button
            onClick={startScanning}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <CameraIcon className="h-4 w-4 mr-2" />
            Start Camera
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            Stop Camera
          </button>
        )}

        <label className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer">
          <PhotoIcon className="h-4 w-4 mr-2" />
          Upload Image
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Analyzing...</span>
        </div>
      )}

      {/* Scanner Display */}
      {scanning && (
        <div className="mb-4">
          <div id="qr-reader" className="w-full"></div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-medium text-green-800">Scan Result</h3>
          </div>
          <div className="mt-2 space-y-2">
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 text-gray-900">{result.type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Data:</span>
              <span className="ml-2 text-gray-900 font-mono text-sm break-all">{result.data}</span>
            </div>
            {result.confidence && (
              <div>
                <span className="font-medium text-gray-700">Confidence:</span>
                <span className="ml-2 text-gray-900">{(result.confidence * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {(lastScanResults.barcodes.length > 0 || lastScanResults.text || lastScanResults.labels.length > 0) && (
        <div className="space-y-4">
          {/* Barcodes */}
          {lastScanResults.barcodes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Detected Barcodes</h4>
              {lastScanResults.barcodes.map((barcode, index) => (
                <div key={index} className="text-sm text-blue-700 mb-1">
                  <span className="font-medium">{barcode.type}:</span> {barcode.data}
                </div>
              ))}
            </div>
          )}

          {/* Extracted Text */}
          {lastScanResults.text && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">Extracted Text</h4>
              <p className="text-sm text-green-700 whitespace-pre-wrap">{lastScanResults.text}</p>
            </div>
          )}

          {/* Image Labels */}
          {lastScanResults.labels.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-2">Image Labels</h4>
              <div className="flex flex-wrap gap-2">
                {lastScanResults.labels.map((label, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MLBarcodeScanner;