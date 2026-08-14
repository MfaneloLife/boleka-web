/**
 * Client-side Meta Pixel helper.
 *
 * Fires the browser pixel event and mirrors it server-side through the
 * Conversions API (CAPI) using a shared event_id so Meta can deduplicate.
 */

declare global {
  interface Window {
    fbq?: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>,
      options?: Record<string, unknown>
    ) => void;
  }
}

function generateEventId(): string {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  // Fallback for older browsers without crypto.randomUUID()
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function trackCompleteRegistration(email: string): Promise<void> {
  const eventId = generateEventId();

  // 1) Browser pixel event — deduplicated with CAPI via the shared eventID.
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "CompleteRegistration", {}, { eventID: eventId });
  }

  // 2) Conversions API event (fire-and-forget).
  try {
    await fetch("/api/meta-capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, event_id: eventId }),
    });
  } catch (error) {
    console.error("Meta CAPI request failed", error);
  }
}
