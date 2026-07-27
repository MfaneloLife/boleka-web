"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  ArrowRight,
  AlertTriangle,
  ShoppingBag,
  QrCode,
  Scan,
  Timer,
  PackageCheck,
  RotateCcw,
  CircleDollarSign,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TypeScript interfaces                                              */
/* ------------------------------------------------------------------ */
interface RequestData {
  id: string;
  status: string;
  returnStatus?: string;
  item: {
    id: string;
    title: string;
    imageUrls: string[];
    price: number;
  };
  requester: { id: string; name: string; image: string | null };
  owner: { id: string; name: string; image: string | null };
  totalPrice: number | null;
  finalValue: number | null;
  paymentMethod?: string | null;
  updatedAt: string;
}

interface QRState {
  data: string;
  expiresAt: string;
  expiresIn: number;
}

/* ------------------------------------------------------------------ */
/*  Helper: human-friendly status label                                */
/* ------------------------------------------------------------------ */
function statusLabel(status: string): string {
  switch (status) {
    case "PENDING": return "Awaiting Owner Response";
    case "ACCEPTED": return "Request Accepted";
    case "NEGOTIATING": return "Price Negotiation";
    case "SUCCESSFUL": return "Booking Confirmed";
    case "COMPLETED": return "Booking Completed";
    case "REJECTED": return "Request Declined";
    case "CANCELLED": return "Request Cancelled";
    default: return status;
  }
}

/* ================================================================== */
/*  MAIN PAGE COMPONENT                                                */
/* ================================================================== */
export default function RequestWaitingPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;
  const { user, isLoaded, isSignedIn } = useUser();

  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  /* QR state */
  const [qrState, setQrState] = useState<QRState | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrTimeRemaining, setQrTimeRemaining] = useState(0);
  const [qrCanvasRef, setQrCanvasRef] = useState<HTMLCanvasElement | null>(null);

  /* Scan state */
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  /* ---- fetch request status ---- */
  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/requests/${requestId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Request not found");
        if (res.status === 403) throw new Error("You don't have access to this request");
        throw new Error("Failed to load request");
      }
      const data = await res.json();
      setRequestData((prev) => {
        if (prev && prev.status !== data.status) {
          setPrevStatus(prev.status);
        }
        return data;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const intendedUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect_url=${encodeURIComponent(intendedUrl)}`);
      return;
    }
    fetchRequest();
  }, [isLoaded, isSignedIn, fetchRequest, router]);

  /* ---- poll while in active states ---- */
  useEffect(() => {
    if (!requestData) return;
    const terminalStatuses = ["REJECTED", "CANCELLED", "RETURNED"];
    if (terminalStatuses.includes(requestData.status)) return;
    // Also stop polling RETURNED returnStatus
    if (requestData.returnStatus === "RETURNED") return;
    const interval = setInterval(() => {
      fetchRequest();
    }, 5000);
    return () => clearInterval(interval);
  }, [requestData?.status, requestData?.returnStatus, fetchRequest]);

  /* ---- QR timer countdown ---- */
  useEffect(() => {
    if (!qrState) return;
    const expiry = new Date(qrState.expiresAt).getTime();
    const update = () => {
      const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setQrTimeRemaining(remaining);
      if (remaining === 0) setQrState(null);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [qrState]);

  /* ---- generate QR code image on canvas ---- */
  useEffect(() => {
    if (!qrState || !qrCanvasRef) return;
    const loadQR = async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        await QRCode.toCanvas(qrCanvasRef, qrState.data, { width: 220, margin: 2 });
      } catch { /* ignore if qrcode not available */ }
    };
    loadQR();
  }, [qrState, qrCanvasRef]);

  /* ---- generate completion QR (renter only) ---- */
  const handleGenerateQR = async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}/generate-qr`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate QR");
      setQrState({ data: data.qrData, expiresAt: data.expiresAt, expiresIn: data.expiresIn });
      setQrTimeRemaining(data.expiresIn);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Failed to generate QR code");
    } finally {
      setQrLoading(false);
    }
  };

  /* ---- generate return QR (vendor only) ---- */
  const handleGenerateReturnQR = async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await fetch(`/api/requests/${requestId}/generate-return-qr`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate return QR");
      setQrState({ data: data.qrData, expiresAt: data.expiresAt, expiresIn: data.expiresIn });
      setQrTimeRemaining(data.expiresIn);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Failed to generate return QR code");
    } finally {
      setQrLoading(false);
    }
  };

  /* ---- scan QR code (manual text input fallback) ---- */
  const handleScanQR = async (qrCodeText: string) => {
    setScanning(true);
    setScanError(null);
    setScanResult(null);
    try {
      const res = await fetch(`/api/requests/${requestId}/scan-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: qrCodeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "QR scan failed");
      setScanResult(data.message);
      // Refresh request data
      setTimeout(() => fetchRequest(), 1000);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Failed to scan QR");
    } finally {
      setScanning(false);
    }
  };

  /* ---- loading ---- */
  if (!isLoaded || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  /* ---- error ---- */
  if (error || !requestData) {
    return (
      <div className="max-w-lg mx-auto mt-20 px-4 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6">{error || "Request not found"}</p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition">
          Browse Items
        </Link>
      </div>
    );
  }

  const isRequester = user?.id === requestData.requester.id;
  const isOwner = user?.id === requestData.owner.id;
  const item = requestData.item;
  const itemImage = item.imageUrls?.[0];

  const renderQRDisplay = () => {
    if (!qrState) return null;
    return (
      <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl text-center">
        <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center justify-center gap-1.5">
          <Timer className="w-4 h-4 text-orange-500" />
          Expires in {qrTimeRemaining}s
        </p>
        <canvas ref={(el) => setQrCanvasRef(el)} className="mx-auto" />
        <p className="text-xs text-gray-500 mt-3">
          Have the other party scan this QR code to proceed.
        </p>
      </div>
    );
  };

  const renderScanInput = (label: string, placeholder: string) => {
    const [input, setInput] = useState("");
    return (
      <div className="mt-4 p-4 bg-white border border-gray-200 rounded-xl">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
          />
          <button
            onClick={() => handleScanQR(input)}
            disabled={scanning || !input.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan"}
          </button>
        </div>
        {scanResult && <p className="mt-2 text-xs text-emerald-600 font-medium">{scanResult}</p>}
        {scanError && <p className="mt-2 text-xs text-red-600">{scanError}</p>}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* ================================================================ */}
      {/*  PENDING - Waiting for owner                                     */}
      {/* ================================================================ */}
      {requestData.status === "PENDING" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-yellow-50 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-yellow-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Request Sent!</h1>
          <p className="text-gray-600 mb-2">Your request has been sent to the owner.</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 inline-flex items-center gap-4 min-w-0 max-w-full">
            <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0 relative">
              {itemImage ? (
                <Image src={itemImage} alt={item.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
              <p className="text-xs text-gray-500">R {requestData.totalPrice?.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-semibold text-yellow-800 mb-2">Waiting for the owner to accept your request</p>
            <ul className="text-xs text-yellow-700 space-y-1.5">
              <li className="flex items-start gap-2"><span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />The owner will review your request and accept or decline</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />Once accepted, you'll be able to negotiate the final price</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />This page updates automatically — no need to refresh</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/messages/${requestId}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition">
              <MessageCircle className="w-4 h-4" /> Go to Messages <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
              Discover Items
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  ACCEPTED / NEGOTIATING                                          */}
      {/* ================================================================ */}
      {(requestData.status === "ACCEPTED" || requestData.status === "NEGOTIATING") && (
        <div className={`bg-white border rounded-2xl p-6 sm:p-10 text-center shadow-sm ${prevStatus === "PENDING" ? "border-emerald-200" : "border-blue-200"}`}>
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {prevStatus === "PENDING" ? "Request Accepted!" : "Request Accepted"}
          </h1>
          <p className="text-gray-600 mb-4">The owner has accepted your request for <span className="font-semibold text-gray-900">{item.title}</span>.</p>

          {requestData.status === "NEGOTIATING" && requestData.finalValue ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-emerald-800 mb-1">Final Price Confirmed</p>
              <p className="text-2xl font-bold text-emerald-700">R {requestData.finalValue.toFixed(2)}</p>
              <p className="text-xs text-emerald-600 mt-1">You can now proceed to settle and confirm your booking</p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-blue-800 mb-1">Waiting for Owner to Set Final Price</p>
              <p className="text-xs text-blue-600">The owner will set the agreed final price. Once confirmed, you can proceed to payment.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/messages/${requestId}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition">
              <MessageCircle className="w-4 h-4" /> Go to Messages <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/messages" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
              View All Messages
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  SUCCESSFUL - Booking confirmed + QR options                     */}
      {/* ================================================================ */}
      {requestData.status === "SUCCESSFUL" && (
        <div className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-2">
            Your booking for <span className="font-semibold text-gray-900">{item.title}</span> has been confirmed.
          </p>
          {requestData.paymentMethod && (
            <p className="text-xs text-gray-500 mb-4">Paid via {requestData.paymentMethod}</p>
          )}

          {/* ---- QR Actions ---- */}
          <div className="border-t border-gray-100 pt-6 mt-6 space-y-4">
            {/* Renter: generate completion QR */}
            {isRequester && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Ready to pick up? Generate a QR code for the vendor to scan:</p>
                <button
                  onClick={handleGenerateQR}
                  disabled={qrLoading || !!qrState}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition"
                >
                  {qrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  {qrState ? "QR Code Generated" : "Generate QR Code for Pickup"}
                </button>
                {qrError && <p className="text-xs text-red-600 mt-2">{qrError}</p>}
                {qrState && (
                  <div className="mt-3">
                    <p className="text-xs text-orange-600 font-medium">QR ready — show this to the vendor</p>
                  </div>
                )}
              </div>
            )}

            {/* Vendor: scan completion QR */}
            {isOwner && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Scan the renter's QR code to complete the booking:</p>
                {renderScanInput("Paste QR Code", "Paste the renter's QR code here...")}
              </div>
            )}

            {renderQRDisplay()}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link href={`/messages/${requestId}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition">
              <MessageCircle className="w-4 h-4" /> View Conversation
            </Link>
            <Link href="/dashboard/orders" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
              My Orders
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  COMPLETED - Booking completed + return QR options               */}
      {/* ================================================================ */}
      {requestData.status === "COMPLETED" && requestData.returnStatus !== "RETURNED" && (
        <div className="bg-white border border-purple-200 rounded-2xl p-6 sm:p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-purple-50 rounded-full flex items-center justify-center">
            <PackageCheck className="w-10 h-10 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Booking Completed!</h1>
          <p className="text-gray-600 mb-4">
            The booking has been completed via QR scan. {!isOwner && "Time to return the item?"}
          </p>

          {/* ---- Return QR Actions ---- */}
          <div className="border-t border-gray-100 pt-6 mt-6 space-y-4">
            {/* Vendor: generate return QR */}
            {isOwner && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Generate a return QR code for the renter:</p>
                <button
                  onClick={handleGenerateReturnQR}
                  disabled={qrLoading || !!qrState}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {qrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  {qrState ? "Return QR Generated" : "Generate Return QR Code"}
                </button>
                {qrError && <p className="text-xs text-red-600 mt-2">{qrError}</p>}
                {qrState && (
                  <div className="mt-3">
                    <p className="text-xs text-purple-600 font-medium">Return QR ready — show this to the renter</p>
                  </div>
                )}
              </div>
            )}

            {/* Renter: scan return QR */}
            {isRequester && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Scan the vendor's return QR code to confirm return:</p>
                {renderScanInput("Paste Return QR Code", "Paste the vendor's return QR code here...")}
              </div>
            )}

            {renderQRDisplay()}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link href={`/messages/${requestId}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition">
              <MessageCircle className="w-4 h-4" /> View Conversation
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  RETURNED - Final state                                          */}
      {/* ================================================================ */}
      {(requestData.status === "COMPLETED" && requestData.returnStatus === "RETURNED") && (
        <div className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Item Returned!</h1>
          <p className="text-gray-600 mb-4">
            The item <span className="font-semibold text-gray-900">{item.title}</span> has been successfully returned. Thank you for using Boleka!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/messages/${requestId}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition">
              <MessageCircle className="w-4 h-4" /> View Conversation
            </Link>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
              Browse More Items
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  REJECTED                                                        */}
      {/* ================================================================ */}
      {requestData.status === "REJECTED" && (
        <div className="bg-white border border-red-200 rounded-2xl p-6 sm:p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Request Declined</h1>
          <p className="text-gray-600 mb-6">
            The owner has declined your request for <span className="font-semibold text-gray-900">{item.title}</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition">
              Discover Items <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/messages" className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
              View Messages
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  CANCELLED                                                       */}
      {/* ================================================================ */}
      {requestData.status === "CANCELLED" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Request Cancelled</h1>
          <p className="text-gray-600 mb-6">This request has been cancelled.</p>
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition">
            Browse Items <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}