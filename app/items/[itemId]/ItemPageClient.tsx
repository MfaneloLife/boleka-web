"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ItemPageClientProps {
  itemId: string;
  ownerId: string;
}

export default function ItemPageClient({ itemId, ownerId }: ItemPageClientProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = isLoaded && user && user.id === ownerId;

  const handleRequest = async () => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setIsRequesting(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        const data = await res.json();
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
      </div>
    </div>
  );
}
