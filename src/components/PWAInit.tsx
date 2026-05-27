"use client";

import { useEffect } from "react";
import PWAInstallPrompt from "@/src/components/PWAInstallPrompt";

export default function PWAInit() {
  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          console.log("[PWA] Service worker registered");
        })
        .catch((err) => {
          console.error("[PWA] Service worker registration failed:", err);
        });
    }
  }, []);

  return <PWAInstallPrompt />;
}
