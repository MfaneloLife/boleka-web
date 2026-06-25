"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MessageBubble from '@/src/components/MessageBubble';
import MessageInput from '@/src/components/MessageInput';
import { useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Loader2,
  X,
  Check,
  Banknote,
  Building2,
  Receipt,
  ChevronRight,
  Tag,
  Info,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  TypeScript interfaces                                              */
/* ------------------------------------------------------------------ */
interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  imageUrl?: string | null;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface RequestData {
  id: string;
  item: {
    id: string;
    title: string;
    imageUrls: string[];
    price: number;
    userId: string;
  };
  requester: {
    id: string;
    name: string;
    image: string | null;
  };
  owner: {
    id: string;
    name: string;
    image: string | null;
  };
  status: string;
  totalPrice: number | null;
  finalValue: number | null;
  paymentMethod: string | null;
  startDate: string | null;
  endDate: string | null;
  updatedAt: string;
}

type SettlementPhase = 'idle' | 'choose-method' | 'settling' | 'success';

/* ------------------------------------------------------------------ */
/*  Helper: human-friendly status label                                */
/* ------------------------------------------------------------------ */
function statusLabel(status: string, finalValue: number | null): string {
  if (status === 'PENDING') return 'Awaiting Owner Response';
  if (status === 'ACCEPTED') return 'Request Accepted';
  if (status === 'NEGOTIATING' && finalValue) return 'Awaiting Price Confirmation';
  if (status === 'NEGOTIATING') return 'Negotiating Price';
  if (status === 'SUCCESSFUL') return 'Booking Confirmed';
  return status.charAt(0) + status.slice(1).toLowerCase();
}

/* ------------------------------------------------------------------ */
/*  Status badge colour mapping                                        */
/* ------------------------------------------------------------------ */
function statusBadgeClass(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'ACCEPTED':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'NEGOTIATING':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'SUCCESSFUL':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'CANCELLED':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

/* ================================================================== */
/*  MAIN PAGE COMPONENT                                                */
/* ================================================================== */
export default function ConversationPage({ params }: { params: { requestId: string } }) {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  /* ---- state ---- */
  const [requestData, setRequestData] = useState<RequestData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Manager Tools (owner price-update) */
  const [showManagerTools, setShowManagerTools] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [priceUpdating, setPriceUpdating] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  /* Settlement (renter payment) */
  const [settlementPhase, setSettlementPhase] = useState<SettlementPhase>('idle');
  const [settlingMethod, setSettlingMethod] = useState<'CASH' | 'EFT' | null>(null);
  const [settling, setSettling] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ---- derived values ---- */
  const currentUserId = user?.id ?? '';
  const isOwner = currentUserId === (requestData?.item?.userId ?? '');
  const isRenter = currentUserId === (requestData?.requester?.id ?? '');
  const isNegotiating = requestData?.status === 'NEGOTIATING';
  const isSuccessful = requestData?.status === 'SUCCESSFUL';
  const isPending = requestData?.status === 'PENDING';
  const isAccepted = requestData?.status === 'ACCEPTED';
  const ownerCanPrice = isOwner && (isPending || isAccepted || isNegotiating);
  const renterCanSettle = isRenter && isNegotiating && !!requestData?.finalValue;
  const displayedPrice = requestData?.finalValue ?? requestData?.totalPrice;

  /* ---- fetch conversation ---- */
  const fetchConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/messages/${params.requestId}`);
      if (!response.ok) {
        if (response.status === 401) throw new Error('Please log in to view this conversation.');
        if (response.status === 403) throw new Error('You do not have access to this conversation.');
        if (response.status === 404) throw new Error('This conversation was not found.');
        const text = await response.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            throw new Error(json.error || 'Failed to load conversation');
          } catch {
            throw new Error('Failed to load conversation. Please try again.');
          }
        }
        throw new Error('Failed to load conversation. Please try again.');
      }

      const text = await response.text();
      if (!text) throw new Error('Received empty response from server.');
      const data = JSON.parse(text);
      setMessages(data.messages || []);
      setRequestData(data.request || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [params.requestId]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      window.location.href = '/auth/login';
      return;
    }
    fetchConversation();
  }, [isLoaded, isSignedIn, params.requestId, fetchConversation]);

  /* ---- polling for real-time-ish updates when in negotiation ---- */
  useEffect(() => {
    if (!isNegotiating && !isPending && !isAccepted) return;
    const interval = setInterval(() => {
      fetchConversation();
    }, 7000);
    return () => clearInterval(interval);
  }, [isNegotiating, isPending, isAccepted, fetchConversation]);

  /* ---- image compression ---- */
  const compressToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result.split(',')[1]);
          else reject(new Error('Failed to convert file'));
        };
        reader.onerror = () => reject(reader.error);
        return;
      }
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX) { h = (h * MAX) / w; w = MAX; }
        if (h > MAX) { w = (w * MAX) / h; h = MAX; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context failed')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
        resolve(base64);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
      img.src = url;
    });
  };

  /* ---- send message ---- */
  const handleSendMessage = async (content: string, file?: File) => {
    if ((!content.trim() && !file) || !user) return;
    setError(null);
    try {
      const payload: { content: string; imageBase64?: string } = {
        content: content.trim(),
      };
      if (file) {
        const compressedBase64 = await compressToBase64(file);
        payload.imageBase64 = compressedBase64;
      }
      const response = await fetch(`/api/messages/${params.requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            throw new Error(json.error || 'Failed to send message');
          } catch {
            throw new Error('Failed to send message');
          }
        }
        throw new Error('Failed to send message');
      }
      const text = await response.text();
      if (text) {
        const newMessage = JSON.parse(text);
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send your message. Please try again.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  /* ---- owner: update final price ---- */
  const handleUpdatePrice = async () => {
    const val = parseFloat(priceInput);
    if (isNaN(val) || val <= 0) {
      setPriceError('Please enter a valid positive number');
      return;
    }
    setPriceUpdating(true);
    setPriceError(null);
    try {
      const res = await fetch(`/api/requests/${params.requestId}/update-price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalValue: val }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to update price');
      // Immediately reflect the change
      setRequestData((prev) =>
        prev ? { ...prev, finalValue: body.finalValue, status: body.status } : prev
      );
      setShowManagerTools(false);
      setPriceInput('');
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : 'Failed to update price');
    } finally {
      setPriceUpdating(false);
    }
  };

  /* ---- renter: settle booking ---- */
  const handleSettle = async (method: 'CASH' | 'EFT') => {
    setSettling(true);
    try {
      const res = await fetch(`/api/requests/${params.requestId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to settle');
      setReceipt(body.receipt);
      setSettlementPhase('success');
      setRequestData((prev) =>
        prev ? { ...prev, status: 'SUCCESSFUL', paymentMethod: method } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Settlement failed. Please try again.');
      setSettlementPhase('idle');
    } finally {
      setSettling(false);
    }
  };

  /* ---- other party ---- */
  const otherParty = (() => {
    if (!user || !requestData) return null;
    return currentUserId === requestData.requester.id
      ? requestData.owner
      : requestData.requester;
  })();

  /* ---- loading ---- */
  if (!isLoaded || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }
  if (!isSignedIn) return null;

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {/* ---- Top Bar (mobile / shared) ---- */}
      {requestData && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
          <Link
            href="/messages"
            className="text-gray-500 hover:text-gray-700 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-shrink-0 h-10 w-10 relative">
            {otherParty?.image ? (
              <Image
                src={otherParty.image}
                alt={otherParty.name || 'User'}
                className="rounded-full object-cover"
                width={40}
                height={40}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-orange-600">
                  {otherParty?.name ? otherParty.name.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {otherParty?.name || 'User'}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {requestData.item.title}
            </div>
          </div>
          {/* Status badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize shrink-0 border ${statusBadgeClass(
              requestData.status
            )}`}
          >
            {statusLabel(requestData.status, requestData.finalValue)}
          </span>
          {/* Price pill */}
          {displayedPrice && (
            <span className="text-sm font-bold text-orange-600 shrink-0 ml-1">
              R {displayedPrice.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* ---- Error banner ---- */}
      {error && (
        <div className="m-4 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      {/* ---- MAIN BODY: mobile = chat only; desktop = split ---- */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* ================================================================ */}
        {/*  LEFT: Chat terminal (mobile: 100%, desktop: 65%)                 */}
        {/* ================================================================ */}
        <div className="flex-1 flex flex-col min-h-0 md:w-[65%]">
          {/* Scrollable messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto">
              {/* Item summary card */}
              {requestData && (
                <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 relative overflow-hidden rounded-lg bg-gray-50">
                      {requestData.item.imageUrls?.length > 0 ? (
                        <Image
                          src={requestData.item.imageUrls[0]}
                          alt={requestData.item.title}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center text-gray-300">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {requestData.item.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        R {requestData.item.price?.toFixed(2)}/day
                      </p>
                    </div>
                    <Link
                      href={`/items/${requestData.item.id}`}
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium shrink-0 transition-colors"
                    >
                      View Item
                    </Link>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isCurrentUser={message.senderId === currentUserId}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-orange-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-semibold">No messages yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start the conversation by sending a message.
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ---- MOBILE: Manager Tools button (owner) & Renater settle strip ---- */}
          {/* These are visible only on mobile; hidden on md+ because they move to sidebar */}
          <div className="md:hidden shrink-0 bg-white border-t border-gray-100 px-4 py-2">
            {/* Owner manager tools trigger */}
            {ownerCanPrice && (
              <button
                onClick={() => {
                  setPriceInput(requestData?.finalValue?.toString() ?? '');
                  setShowManagerTools(true);
                }}
                className="w-full mb-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 active:scale-[0.98] transition-all"
              >
                <Tag className="w-4 h-4" />
                Manager Tools – Set Final Price
              </button>
            )}

            {/* Renter settle strip */}
            {renterCanSettle && (
              <button
                onClick={() => setSettlementPhase('choose-method')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all"
              >
                <Banknote className="w-4 h-4" />
                Proceed to Settle Booking (R {requestData?.finalValue?.toFixed(2)})
              </button>
            )}

            {/* Settlement success (mobile) */}
            {settlementPhase === 'success' && receipt && (
              <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
                <p className="font-semibold text-emerald-800">
                  Booking Confirmed! <Receipt className="inline w-4 h-4 ml-1" />
                </p>
                <p className="text-emerald-700 mt-1">
                  Reference: <span className="font-mono">{receipt.bookingReference}</span>
                </p>
                <p className="text-emerald-700">Paid: R {receipt.finalAmount.toFixed(2)} via {receipt.paymentMethod}</p>
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="bg-white border-t border-gray-100 p-4 shadow-lg shrink-0">
            <div className="max-w-4xl mx-auto">
              <MessageInput onSendMessage={handleSendMessage} />
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/*  RIGHT: Transaction Sidebar Card (desktop only, 35%)              */}
        {/* ================================================================ */}
        <aside className="hidden md:flex md:w-[35%] md:min-w-[320px] md:max-w-[440px] flex-col border-l border-gray-200 bg-white overflow-y-auto shrink-0">
          {requestData ? (
            <div className="p-5 sticky top-0 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-gray-900">Transaction Details</h3>
              </div>

              {/* Status log */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Status Log
                </p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border capitalize ${statusBadgeClass(
                    requestData.status
                  )}`}
                >
                  {statusLabel(requestData.status, requestData.finalValue)}
                </span>
                {requestData.paymentMethod && (
                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                    {requestData.paymentMethod}
                  </span>
                )}
              </div>

              {/* Item thumbnail */}
              <div className="flex gap-3 items-start">
                <div className="w-14 h-14 relative overflow-hidden rounded-lg bg-gray-100 shrink-0">
                  {requestData.item.imageUrls?.length > 0 ? (
                    <Image
                      src={requestData.item.imageUrls[0]}
                      alt={requestData.item.title}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      No img
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {requestData.item.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Initial: R {requestData.item.price?.toFixed(2)}/day
                  </p>
                  {requestData.startDate && (
                    <p className="text-xs text-gray-500">
                      From {new Date(requestData.startDate).toLocaleDateString()}
                      {requestData.endDate
                        ? ` → ${new Date(requestData.endDate).toLocaleDateString()}`
                        : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Initial Price</span>
                  <span className="font-semibold text-gray-900">
                    R {requestData.totalPrice?.toFixed(2) ?? '0.00'}
                  </span>
                </div>
                {requestData.finalValue && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Agreed Final Price</span>
                    <span className="font-bold text-orange-600">
                      R {requestData.finalValue.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/*  OWNER VIEW: Manager Tools (desktop sidebar widget)       */}
              {/* ======================================================== */}
              {ownerCanPrice && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-orange-800 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Manager Tools
                  </p>
                  <label className="block">
                    <span className="text-xs text-gray-600 font-medium">
                      Enter Final Agreed Price (ZAR)
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={requestData.finalValue?.toString() ?? requestData.totalPrice?.toString() ?? '0.00'}
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                    />
                  </label>
                  {priceError && (
                    <p className="text-xs text-red-600">{priceError}</p>
                  )}
                  <button
                    onClick={handleUpdatePrice}
                    disabled={priceUpdating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-60 transition-all"
                  >
                    {priceUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Confirm & Lock Final Price
                  </button>
                </div>
              )}

              {/* ======================================================== */}
              {/*  RENTER VIEW: Payment trigger (desktop sidebar)           */}
              {/* ======================================================== */}
              {renterCanSettle && settlementPhase === 'idle' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-emerald-800">Ready for Payment</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Due</span>
                    <span className="font-bold text-emerald-700">
                      R {requestData.finalValue?.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSettlementPhase('choose-method')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Proceed to Finalize Booking (R {requestData.finalValue?.toFixed(2)})
                  </button>
                </div>
              )}

              {/* Settlement method picker */}
              {settlementPhase === 'choose-method' && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-bold text-gray-900">Choose Payment Method</p>
                  <button
                    onClick={() => handleSettle('CASH')}
                    disabled={settling}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                  >
                    <Banknote className="w-5 h-5 text-orange-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Cash / Pay at Branch</p>
                      <p className="text-xs text-gray-500">Pay in person at an E-Boleka partner branch</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleSettle('EFT')}
                    disabled={settling}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                  >
                    <Building2 className="w-5 h-5 text-orange-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Direct Bank EFT</p>
                      <p className="text-xs text-gray-500">Transfer directly to the owner's bank account</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setSettlementPhase('idle')}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Cancel
                  </button>
                  {settling && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </div>
                  )}
                </div>
              )}

              {/* Success / Receipt card */}
              {settlementPhase === 'success' && receipt && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-800">Booking Confirmed</p>
                  </div>
                  <div className="text-sm text-emerald-700 space-y-1">
                    <p>
                      Reference:{' '}
                      <span className="font-mono font-semibold">{receipt.bookingReference}</span>
                    </p>
                    <p>Item: {receipt.itemTitle}</p>
                    <p>Final Amount: R {receipt.finalAmount.toFixed(2)}</p>
                    <p>Platform Commission (10%): R {receipt.platformCommission.toFixed(2)}</p>
                    <p>Vendor Payout: R {receipt.vendorPayout.toFixed(2)}</p>
                    <p>Method: {receipt.paymentMethod}</p>
                    <p>Date: {new Date(receipt.settledAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-all"
                  >
                    <Receipt className="w-4 h-4" />
                    Print Receipt
                  </button>
                </div>
              )}

              {/* Already successful (no settlement needed) */}
              {isSuccessful && settlementPhase !== 'success' && !receipt && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-emerald-800 mb-2">Booking Confirmed</p>
                  <p className="text-xs text-emerald-700">
                    This booking has been settled. Reference:{' '}
                    <span className="font-mono">{requestData.id}</span>
                    {requestData.paymentMethod && (
                      <> via {requestData.paymentMethod}</>
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 text-sm text-gray-500">Loading transaction details…</div>
          )}
        </aside>
      </div>

      {/* ================================================================ */}
      {/*  MOBILE: Manager Tools Bottom Drawer Overlay (owner only)         */}
      {/* ================================================================ */}
      {showManagerTools && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowManagerTools(false)}
          />
          {/* drawer */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-5 pb-8 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">Manager Tools</p>
              <button onClick={() => setShowManagerTools(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block">
              <span className="text-sm text-gray-600 font-medium">
                Enter Final Agreed Price (ZAR)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder={requestData?.finalValue?.toString() ?? requestData?.totalPrice?.toString() ?? '0.00'}
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
              />
            </label>
            {priceError && <p className="text-xs text-red-600">{priceError}</p>}
            <button
              onClick={handleUpdatePrice}
              disabled={priceUpdating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-60 transition-all"
            >
              {priceUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Confirm & Lock Final Price
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  MOBILE: Settlement method bottom drawer (renter only)            */}
      {/* ================================================================ */}
      {settlementPhase === 'choose-method' && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSettlementPhase('idle')}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-5 pb-8 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">Choose Payment Method</p>
              <button onClick={() => setSettlementPhase('idle')} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Amount Due: <span className="font-bold text-emerald-700">R {requestData?.finalValue?.toFixed(2)}</span>
            </p>
            <button
              onClick={() => handleSettle('CASH')}
              disabled={settling}
              className="w-full flex items-center gap-3 px-4 py-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
            >
              <Banknote className="w-6 h-6 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Cash / Pay at Branch</p>
                <p className="text-xs text-gray-500">Pay in person at an E-Boleka partner branch</p>
              </div>
            </button>
            <button
              onClick={() => handleSettle('EFT')}
              disabled={settling}
              className="w-full flex items-center gap-3 px-4 py-4 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
            >
              <Building2 className="w-6 h-6 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Direct Bank EFT</p>
                <p className="text-xs text-gray-500">Transfer directly to the owner's bank account</p>
              </div>
            </button>
            {settling && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing…
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  MOBILE: Success receipt overlay                                  */}
      {/* ================================================================ */}
      {settlementPhase === 'success' && receipt && (
        <div className="fixed inset-0 z-50 md:hidden flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSettlementPhase('idle')}
          />
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 pb-10 max-w-sm w-full mx-4 space-y-4 animate-slide-up">
            <div className="flex items-center gap-2">
              <Receipt className="w-6 h-6 text-emerald-600" />
              <p className="text-lg font-bold text-emerald-800">Booking Confirmed!</p>
            </div>
            <div className="text-sm text-gray-700 space-y-2">
              <p>
                Reference:{' '}
                <span className="font-mono font-semibold">{receipt.bookingReference}</span>
              </p>
              <p>Item: {receipt.itemTitle}</p>
              <p>Final Amount: R {receipt.finalAmount.toFixed(2)}</p>
              <p>Platform Commission (10%): R {receipt.platformCommission.toFixed(2)}</p>
              <p>Vendor Payout: R {receipt.vendorPayout.toFixed(2)}</p>
              <p>Method: {receipt.paymentMethod}</p>
              <p>Date: {new Date(receipt.settledAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-emerald-300 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-all"
              >
                <Receipt className="w-4 h-4" />
                Print Receipt
              </button>
              <button
                onClick={() => setSettlementPhase('idle')}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}