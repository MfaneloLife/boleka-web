"use client";

import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { PlusCircle } from "lucide-react";

export default function FloatingCTA() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  if (!isLoaded) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {isSignedIn ? (
        <button
          onClick={() => router.push("/dashboard/items?action=list")}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          List an item
        </button>
      ) : (
        <SignInButton mode="modal">
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95">
            <PlusCircle className="w-5 h-5" />
            List an item
          </button>
        </SignInButton>
      )}
    </div>
  );
}
