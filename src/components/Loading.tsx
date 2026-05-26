"use client";

export default function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[70vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
