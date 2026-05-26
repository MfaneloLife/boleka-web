"use client";

import { useState, useCallback } from "react";

interface UseR2UploadOptions {
  folder?: string;
}

interface UploadResult {
  url: string;
  key: string;
}

export function useR2Upload(options: UseR2UploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (options.folder) {
          formData.append("folder", options.folder);
        }

        const res = await fetch("/api/upload/r2", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        return data as UploadResult;
      } catch (err: any) {
        setError(err.message || "Unknown upload error");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [options.folder]
  );

  return { upload, uploading, error };
}
