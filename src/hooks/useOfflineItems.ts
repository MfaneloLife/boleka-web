"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const CACHE_KEY = "boleka_cached_items";
const MAX_CACHED = 50;

interface CachedItems {
  items: unknown[];
  updatedAt: number;
}

/**
 * Reads cached items from localStorage. Returns empty array on failure.
 */
function readCache(): CachedItems | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedItems;
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Writes items to localStorage, keeping only the latest MAX_CACHED entries.
 */
function writeCache(items: unknown[]): void {
  try {
    const slice = items.slice(-MAX_CACHED);
    const payload: CachedItems = { items: slice, updatedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/**
 * Hook that provides offline-aware caching for item lists.
 *
 * Returns:
 *  - items: current items (from network, or cached when offline)
 *  - isOffline: whether the browser is currently offline
 *  - cacheLoaded: whether cached data was loaded (so the UI can show a banner)
 *  - updateCache: call this with fresh items after a successful fetch
 *  - setOffline: manually toggle offline state
 */
export function useOfflineItems<T>() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const cachedItemsRef = useRef<T[]>([]);
  // Track whether cache was used for display (not just initially loaded)
  const [showingCached, setShowingCached] = useState(false);

  /* ---------- Listen for online/offline events ---------- */
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  /* ---------- Load cache on mount ---------- */
  useEffect(() => {
    const cached = readCache();
    if (cached && cached.items.length > 0) {
      cachedItemsRef.current = cached.items as T[];
    }
    setCacheLoaded(true);
  }, []);

  /**
   * Call after a successful fetch to persist items to the cache.
   * Also resets the showing-cached flag since we have live data.
   */
  const updateCache = useCallback((items: T[]) => {
    if (items.length > 0) {
      cachedItemsRef.current = items;
      writeCache(items);
    }
    setShowingCached(false);
  }, []);

  /**
   * Call when a fetch fails — returns the cached items (if any) so the UI can
   * fall back gracefully.
   */
  const getCachedFallback = useCallback((): T[] => {
    const cached = readCache();
    if (cached && cached.items.length > 0) {
      setShowingCached(true);
      return cached.items as T[];
    }
    return [];
  }, []);

  return {
    isOffline,
    showingCached,
    cacheLoaded,
    updateCache,
    getCachedFallback,
    cachedItems: cachedItemsRef.current,
  };
}