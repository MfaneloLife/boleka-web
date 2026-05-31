"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallContextType {
  /** The deferred beforeinstallprompt event (only available on Android Chrome) */
  deferredPrompt: BeforeInstallPromptEvent | null;
  /** Whether the app is already installed (standalone mode) */
  isInstalled: boolean;
  /** Whether the install prompt can be shown (Android Chrome, not installed, not dismissed) */
  canInstall: boolean;
  /** Trigger the native install prompt */
  installApp: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextType>({
  deferredPrompt: null,
  isInstalled: false,
  canInstall: false,
  installApp: async () => {},
});

export function usePWAInstall() {
  return useContext(PWAInstallContext);
}

export default function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (display-mode: standalone)
    if (typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event (Android Chrome only)
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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const canInstall = deferredPrompt !== null && !isInstalled;

  return (
    <PWAInstallContext.Provider value={{ deferredPrompt, isInstalled, canInstall, installApp }}>
      {children}
    </PWAInstallContext.Provider>
  );
}