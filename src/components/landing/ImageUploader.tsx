"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useR2Upload } from "@/src/hooks/useR2Upload";
import Image from "next/image";

interface ImageUploaderProps {
  onUploadComplete?: (urls: string[]) => void;
  maxFiles?: number;
  folder?: string;
}

export default function ImageUploader({
  onUploadComplete,
  maxFiles = 5,
  folder = "items",
}: ImageUploaderProps) {
  const { upload, uploading, error } = useR2Upload({ folder });
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).slice(0, maxFiles - previews.length);
    if (newFiles.length === 0) return;

    const newPreviews: string[] = [];
    const newUrls: string[] = [];

    for (const file of newFiles) {
      const objectUrl = URL.createObjectURL(file);
      newPreviews.push(objectUrl);

      const result = await upload(file);
      if (result) {
        newUrls.push(result.url);
      }
    }

    setPreviews((prev) => [...prev, ...newPreviews]);
    setUploadedUrls((prev) => [...prev, ...newUrls]);
    onUploadComplete?.([...uploadedUrls, ...newUrls]);
  };

  const handleRemove = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {previews.map((src, idx) => (
          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <Image src={src} alt={`Preview ${idx + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        ))}
        {previews.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-400 transition"
          >
            <span className="text-2xl">+</span>
            <span className="text-xs mt-1">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {uploading && (
        <p className="text-sm text-orange-500">Uploading...</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
