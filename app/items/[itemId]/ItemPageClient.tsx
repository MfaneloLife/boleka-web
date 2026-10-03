"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Loader2, Share2, Check, CalendarRange } from "lucide-react";

interface ItemPageClientProps {
  itemId: string;
  ownerId: string;
}

export default function ItemPageClient({ itemId, ownerId }: ItemPageClientProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const todayISO = new Date().toLocaleDateString("en-CA");

  const isOwner = isLoaded && user && user.id === ownerId;

  const handleRequest = async () => {
    if (!isLoaded) return;
    if (!user) {
      const intendedUrl = window.location.pathname + window.location.search;
      router.push(`/auth/login?redirect_url=${encodeURIComponent(intendedUrl)}`);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T00:00:00`) : null;

    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Please choose the dates you'll need this item (from and to).");
      return;
    }
    if (start < today) {
      setError("The start date can't be in the past.");
      return;
    }
    if (end < start) {
      setError("The end date must be on or after the start date.");
      return;
    }

    setIsRequesting(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, startDate, endDate }),
      });
      if (!res.ok) {
        const data = await res.json();
        // 409 Conflict means the user already has an active request — redirect to it
        if (res.status === 409 && data.existingRequestId) {
          router.push(`/requests/${data.existingRequestId}`);
          return;
        }
        setError(data.error || "Failed to create request");
        return;
      }
      const data = await res.json();
      // Redirect to the dedicated waiting page
      router.push(`/requests/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col gap-3">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {!isOwner && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-orange-600" />
            When do you need it?
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-600">From</span>
              <input
                type="date"
                value={startDate}
                min={todayISO}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-600">To</span>
              <input
                type="date"
                value={endDate}
                min={startDate || todayISO}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-orange-500 focus:ring-orange-500"
              />
            </label>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        {isOwner ? (
          <button
            disabled
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed w-full sm:w-auto"
          >
            This is your item
          </button>
        ) : (
          <button
            onClick={handleRequest}
            disabled={isRequesting}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed transition w-full sm:w-auto"
          >
            {isRequesting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending request...
              </>
            ) : (
              "Request Item"
            )}
          </button>
        )}

        {/* Share button */}
        <button
          onClick={async () => {
            const url = `${window.location.origin}/items/${itemId}`;
            const shareData: ShareData = {
              title: "Check out this item on BOLEKA",
              text: "Check out this item on BOLEKA",
              url,
            };

            // Use Web Share API if available (mobile, Safari, Chrome)
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
              try {
                await navigator.share(shareData);
              } catch {
                // User cancelled or share failed — do nothing
              }
            } else {
              // Fallback: copy link to clipboard
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                setCopied(false);
              }
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition w-full sm:w-auto"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              Link copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              Share
            </>
          )}
        </button>
      </div>
    </div>
  );
}
