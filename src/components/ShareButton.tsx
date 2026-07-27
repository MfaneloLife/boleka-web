"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  itemId: string;
  /** If provided, this className is applied to the button wrapper */
  className?: string;
  /** If true, shows a compact icon-only button (for grids/cards) */
  compact?: boolean;
}

export default function ShareButton({
  itemId,
  className = "",
  compact = false,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
      return;
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleShare}
        className={`w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:bg-white hover:shadow-md ${className}`}
        aria-label="Share item"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Share2 className="w-3.5 h-3.5 text-slate-500 hover:text-orange-500 transition-colors" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition ${className}`}
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
  );
}