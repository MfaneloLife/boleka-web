"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

interface ItemPageClientProps {
  itemId: string;
  ownerId: string;
}

export default function ItemPageClient({ itemId, ownerId }: ItemPageClientProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isRequesting, setIsRequesting] = useState(false);

  const isOwner = isLoaded && user && user.id === ownerId;

  const handleRequest = async () => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setIsRequesting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to create request");
        return;
      }
      router.push("/messages");
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-3">
      {isOwner ? (
        <button
          disabled
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-500 bg-gray-100 cursor-not-allowed w-full sm:w-auto"
        >
          This is your item
        </button>
      ) : (
        <>
          <button
            onClick={handleRequest}
            disabled={isRequesting}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed transition w-full sm:w-auto"
          >
            {isRequesting ? "Sending request..." : "Request Item"}
          </button>
          <button
            onClick={() => {
              if (!isLoaded) return;
              if (!user) {
                router.push("/auth/login");
                return;
              }
              // Navigate to messages with the owner
              router.push(`/messages?userId=${ownerId}`);
            }}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition w-full sm:w-auto"
          >
            Contact Owner
          </button>
        </>
      )}
    </div>
  );
}
