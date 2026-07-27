"use client";

import { useState } from "react";
import Image from "next/image";
import ImageLightbox from "./ImageLightbox";

interface ItemImageGalleryProps {
  images: string[];
  title: string;
}

export default function ItemImageGallery({ images, title }: ItemImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const goToPrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goTo = (index: number) => setLightboxIndex(index);

  const firstImage = images[0] || "/icons/icon-512x512.png";

  return (
    <>
      <div className="md:w-1/2">
        {/* Main image */}
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="relative h-72 sm:h-96 w-full bg-gray-100 cursor-zoom-in"
          aria-label="View full-size image"
        >
          {images.length > 0 ? (
            <Image
              src={firstImage}
              alt={title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </button>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex overflow-x-auto gap-2 p-3">
            {images.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openLightbox(i)}
                className="w-20 h-20 flex-shrink-0 relative rounded-lg overflow-hidden border-2 border-transparent hover:border-orange-400 transition cursor-zoom-in"
              >
                <Image
                  src={url}
                  alt={`${title} - image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goToPrev}
          onNext={goToNext}
          onGoTo={goTo}
        />
      )}
    </>
  );
}