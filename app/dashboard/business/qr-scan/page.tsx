"use client";
import React, { useEffect, useRef, useState } from 'react';

/**
 * Minimal QR Scanner Page (Business)
 * - Business role gate via /api/business/profile
 * - Camera + native BarcodeDetector loop
 * - POST decoded data to /api/orders/qr-scan with vendorId
 */
const QRScannerPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [decoded, setDecoded] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [fallbackActive, setFallbackActive] = useState(false);
  const html5QrcodeRef = useRef<any>(null);
  const html5QrcodeId = 'html5-qrcode-fallback';
  const [rescanReady, setRescanReady] = useState(false);

  // Role check & capture vendorId
  useEffect(() => {
    const checkBusiness = async () => {
      try {
        setAuthChecking(true);
        const res = await fetch('/api/business/profile');
        if (res.status === 404) { setAuthError('You need a business profile to access the QR scanner.'); return; }
        if (!res.ok) { setAuthError('Failed to verify business access'); return; }
        const data = await res.json();
        if (data?.id) setVendorId(data.id);
      } catch (e: any) {
        setAuthError(e.message || 'Access check failed');
      } finally {
        setAuthChecking(false);
      }
    };
    checkBusiness();
  }, []);

  // Start camera after auth passes (native path); if BarcodeDetector unsupported we'll init fallback instead
  useEffect(() => {
    if (authError || authChecking) return;
    if (!('BarcodeDetector' in window)) {
      // Fallback library path
      initFallbackScanner();
      return;
    }
    let stream: MediaStream | null = null;
    const start = async () => {
      try {
        setScanning(true);
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          requestAnimationFrame(detectLoop);
        }
      } catch (e: any) {
        setError(e.message || 'Camera access denied');
        setScanning(false);
      }
    };
    start();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, [authError, authChecking]);

  const detectLoop = async () => {
    if (!videoRef.current) return;
    if (decoded) return; // one-shot
    try {
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const raw = barcodes[0].rawValue || barcodes[0].rawData || '';
            setDecoded(raw);
            submitQR(raw);
            return;
        }
      }
    } catch (e) {
      console.warn('Detect error', e);
    }
    requestAnimationFrame(detectLoop);
  };

  // Fallback initialization using html5-qrcode library
  const initFallbackScanner = async () => {
    try {
      setFallbackActive(true);
      // Dynamic import to keep bundle light
      const mod: any = await import('html5-qrcode');
      const Html5Qrcode = mod.Html5Qrcode || mod.default?.Html5Qrcode;
      if (!Html5Qrcode) {
        setError('Fallback QR library not available');
        return;
      }
      html5QrcodeRef.current = new Html5Qrcode(html5QrcodeId);
      await html5QrcodeRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText: string) => {
          if (!decoded) {
            setDecoded(decodedText);
            html5QrcodeRef.current.stop().catch(()=>{});
            submitQR(decodedText);
          }
        },
        (err: string) => {
          // throttle console spam
        }
      );
    } catch (e: any) {
      setError(e.message || 'Failed to start fallback scanner');
    }
  };

  // Cleanup fallback on unmount
  useEffect(() => {
    return () => {
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current.stop().catch(()=>{});
        html5QrcodeRef.current.clear?.();
      }
    };
  }, []);

  const submitQR = async (qr: string) => {
    try {
      setProcessing(true);
      const res = await fetch('/api/orders/qr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: qr, vendorId: vendorId || undefined })
      });
      const data = await res.json();
      setResult(data);
      if (!res.ok) setError(data.error || 'Failed to process QR');
      setRescanReady(true);
    } catch (e: any) {
      setError(e.message || 'QR submission failed');
      setRescanReady(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleRescan = async () => {
    setDecoded(null);
    setResult(null);
    setError(null);
    setProcessing(false);
    setRescanReady(false);
    if (fallbackActive) {
      // Restart fallback scanner
      try {
        if (html5QrcodeRef.current) {
          await html5QrcodeRef.current.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: 250 },
            (decodedText: string) => {
              if (!decoded) {
                setDecoded(decodedText);
                html5QrcodeRef.current.stop().catch(()=>{});
                submitQR(decodedText);
              }
            }
          );
        } else {
          await initFallbackScanner();
        }
      } catch (e) {
        setError('Failed to restart scanner');
      }
    } else {
      // Native path
      requestAnimationFrame(detectLoop);
    }
  };

  if (authChecking) {
    return <div className="p-4 text-sm text-gray-600">Verifying access...</div>;
  }
  if (authError) {
    return (
      <div className="p-6 max-w-md">
        <h1 className="text-lg font-semibold mb-2">Access Denied</h1>
        <p className="text-sm text-red-600 mb-4">{authError}</p>
        <p className="text-xs text-gray-500">Create or complete your business profile to use the QR scanner.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">QR Scan (Payment Confirmation)</h1>
      {error && <div className="p-2 bg-red-100 text-red-700 text-sm rounded">{error}</div>}
      <div className="relative">
        {!fallbackActive && (
          <>
            <video ref={videoRef} className="w-full max-w-md rounded border" playsInline />
            {!decoded && <div className="absolute inset-0 border-2 border-emerald-500 pointer-events-none" />}
          </>
        )}
        {fallbackActive && (
          <div id={html5QrcodeId} className="w-full max-w-md rounded border" />
        )}
      </div>
      {decoded && <div className="text-sm text-gray-700">Decoded: <span className="font-mono break-all">{decoded}</span></div>}
      {processing && <div className="text-xs text-gray-500">Processing...</div>}
      {result && <pre className="text-xs bg-gray-100 p-2 rounded max-w-md overflow-auto">{JSON.stringify(result, null, 2)}</pre>}
      <p className="text-xs text-gray-500">Camera data never leaves your device except for decoded QR payload.</p>
      {fallbackActive && !decoded && <p className="text-[10px] text-gray-400">Using fallback scanner.</p>}
      {rescanReady && (
        <button
          onClick={handleRescan}
          className="text-xs mt-2 inline-flex items-center px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Scan Another
        </button>
      )}
    </div>
  );
};

export default QRScannerPage;
