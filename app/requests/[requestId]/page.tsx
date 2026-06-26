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
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TypeScript interfaces                                              */
/* ------------------------------------------------------------------ */
interface RequestData {
  id: string;
  status: string;
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
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helper: human-friendly status label                                */
/* ------------------------------------------------------------------ */
function statusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Awaiting Owner Response";
    case "ACCEPTED":
      return "Request Accepted";
    case "NEGOTIATING":
      return "Price Negotiation";
    case "SUCCESSFUL":
      return "Booking Confirmed";
    case "REJECTED":
      return "Request Declined";
    case "CANCELLED":
      return "Request Cancelled";
    default:
      return status;
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

  /* ---- poll while waiting ---- */
  useEffect(() => {
    if (!requestData) return;
    // Poll only when status is not terminal
    const terminalStatuses = ["SUCCESSFUL", "REJECTED", "CANCELLED", "COMPLETED"];
    if (terminalStatuses.includes(requestData.status)) return;
    const interval = setInterval(() => {
      fetchRequest();
    }, 5000);
    return () => clearInterval(interval);
  }, [requestData?.status, fetchRequest]);

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
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
        >
          Browse Items
        </Link>
      </div>
    );
  }

  const isRequester = user?.id === requestData.requester.id;
  const isOwner = user?.id === requestData.owner.id;
  const item = requestData.item;
  const itemImage = item.imageUrls?.[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
      {/* ================================================================ */}
      {/*  PENDING - Waiting for owner                                     */}
      {/* ================================================================ */}
      {requestData.status === "PENDING" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-yellow-50 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-yellow-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Request Sent!
          </h1>
          <p className="text-gray-600 mb-2">
            Your request has been sent to the owner.
          </p>

          {/* Item summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 inline-flex items-center gap-4 min-w-0 max-w-full">
            <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0 relative">
              {itemImage ? (
                <Image
                  src={itemImage}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {item.title}
              </p>
              <p className="text-xs text-gray-500">
                R {requestData.totalPrice?.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm font-semibold text-yellow-800 mb-2">
              Waiting for the owner to accept your request
            </p>
            <ul className="text-xs text-yellow-700 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                The owner will review your request and accept or decline
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                Once accepted, you'll be able to negotiate the final price
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                This page updates automatically — no need to refresh
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/messages/${requestId}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
            >
              <MessageCircle className="w-4 h-4" />
              Go to Messages
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              Discover Items
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  ACCEPTED - Owner has accepted                                   */}
      {/* ================================================================ */}
      {(requestData.status === "ACCEPTED" || requestData.status === "NEGOTIATING") && (
        <div
          className={`bg-white border rounded-2xl p-6 sm:p-10 text-center shadow-sm ${
            prevStatus === "PENDING"
              ? "border-emerald-200 animate-pulse-once"
              : "border-blue-200"
          }`}
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {prevStatus === "PENDING" ? "Request Accepted!" : "Request Accepted"}
          </h1>
          <p className="text-gray-600 mb-4">
            The owner has accepted your request for{" "}
            <span className="font-semibold text-gray-900">{item.title}</span>.
          </p>

          {requestData.status === "NEGOTIATING" && requestData.finalValue ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-emerald-800 mb-1">
                Final Price Confirmed
              </p>
              <p className="text-2xl font-bold text-emerald-700">
                R {requestData.finalValue.toFixed(2)}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                You can now proceed to settle and confirm your booking
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-blue-800 mb-1">
                Waiting for Owner to Set Final Price
              </p>
              <p className="text-xs text-blue-600">
                The owner will set the agreed final price. Once confirmed, you can proceed to payment.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/messages/${requestId}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition"
            >
              <MessageCircle className="w-4 h-4" />
              Go to Messages
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/messages"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              View All Messages
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  REJECTED - Owner declined                                       */}
      {/* ================================================================ */}
      {requestData.status === "REJECTED" && (
        <div className="bg-white border border-red-200 rounded-2xl p-6 sm:p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Request Declined
          </h1>
          <p className="text-gray-600 mb-6">
            The owner has declined your request for{" "}
            <span className="font-semibold text-gray-900">{item.title}</span>.
            Don't worry — there are plenty of other items available.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition"
            >
              Discover Items
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/messages"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              View Messages
            </Link>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/*  SUCCESSFUL - Booking confirmed                                  */}
      {/* ================================================================ */}
      {requestData.status === "SUCCESSFUL" && (
        <div className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-10 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 mb-6">
            Your booking for{" "}
            <span className="font-semibold text-gray-900">{item.title}</span>{" "}
            has been confirmed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/messages/${requestId}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 transition"
            >
              <MessageCircle className="w-4 h-4" />
              View Conversation
            </Link>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              My Orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}