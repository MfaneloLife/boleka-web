"use client";

import { useEffect } from "react";

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

  // No popup — install is handled via sidebar button using PWAInstallContext
  return null;
}