"use client";

import { useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (index: number) => void;
}

export default function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onGoTo,
}: ImageLightboxProps) {
  const touchStartX = useRef<number | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && images.length > 1) onPrev();
      if (e.key === "ArrowRight" && images.length > 1) onNext();
    },
    [onClose, onPrev, onNext, images.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 50;
    if (delta > threshold && images.length > 1) onPrev();
    if (delta < -threshold && images.length > 1) onNext();
    touchStartX.current = null;
  };

  const total = images.length;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Image lightbox"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image counter */}
      {total > 1 && (
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
          {currentIndex + 1} / {total}
        </div>
      )}

      {/* Previous arrow */}
      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-2 sm:left-4 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      )}

      {/* Next arrow */}
      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 sm:right-4 z-10 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative w-full h-full max-w-[90vw] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1} of ${total}`}
          className="w-full h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => onGoTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-white scale-110"
                  : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}