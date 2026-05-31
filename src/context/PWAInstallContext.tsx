"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  canInstall: boolean;
  installApp: () => Promise<void>;
  needsManualInstall: boolean;
}

const PWAInstallContext = createContext<PWAInstallContextType>({
  deferredPrompt: null,
  isInstalled: false,
  canInstall: false,
  installApp: async () => {},
  needsManualInstall: false,
});

export function usePWAInstall() {
  return useContext(PWAInstallContext);
}

function isAndroidChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /android/i.test(ua) && /chrome/i.test(ua) && !/edge|samsung/i.test(ua);
}

export default function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect Android Chrome
    setIsAndroid(isAndroidChrome());

    // Check if already installed (display-mode: standalone)
    if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event (Android Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for app installed event
    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      // Native Android PWA install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // Fallback: show user how to install manually from Chrome menu
      alert("Tap ⋮ (3 dots) in Chrome → 'Add to Home Screen' to install BOLEKA");
    }
  }, [deferredPrompt]);

  // Show button if: not installed AND (deferred prompt available OR on Android Chrome)
  const canInstall = !isInstalled && (deferredPrompt !== null || isAndroid);
  // Needs manual instructions if on Android but deferred prompt hasn't fired yet
  const needsManualInstall = !isInstalled && deferredPrompt === null && isAndroid;

  return (
    <PWAInstallContext.Provider value={{ deferredPrompt, isInstalled, canInstall, installApp, needsManualInstall }}>
      {children}
    </PWAInstallContext.Provider>
  );
}