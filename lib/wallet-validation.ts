/**
 * --------------------------------------------------------------------------
 * Boleka Wallet Payout Validation — Frontend State Logic
 * --------------------------------------------------------------------------
 *
 * This module provides the TypeScript validation functions that drive the
 * "+ Request Payout" button on the mobile wallet screen.
 *
 * DESIGN PHILOSOPHY
 * The R50 minimum payout floor and Tuesday-only payout window are enforced
 * BOTH on the client (for instant UI feedback) AND on the server (the cron
 * processor).  Client-side checks are purely cosmetic — the server-side
 * cron's WHERE clause is the authoritative enforcer.
 *
 * R50 MINIMUM PAYOUT FLOOR
 * Local South African banking networks impose minimum EFT amounts.  Payfast
 * themselves recommend a floor to avoid transactions being rejected by the
 * receiving bank.  We settled on R50 after testing with FNB, Standard Bank,
 * Nedbank, and Capitec.  Any host with less than R50 in availableBalance
 * sees a clear warning and the payout button stays disabled.
 *
 * TUESDAY-ONLY PAYOUT WINDOW
 * Bundling all payouts into a single weekly batch run (Tuesday 04:00 SAST)
 * allows us to:
 *   - Run a single reconciliation pass against the Payfast Payout API.
 *   - Minimise per-transaction network fees (batching = fewer API calls).
 *   - Provide predictable cash-flow timing for hosts ("you get paid every
 *     Tuesday morning").
 *
 * The Tuesday gate is checked against the server's local time (Africa/
 * Johannesburg, UTC+2).  We use `new Date()` and `.getDay()` where
 * 0=Sunday, 2=Tuesday.  For server-side checks, the cron is scheduled
 * via Vercel with the `schedule` field in vercel.json.
 * --------------------------------------------------------------------------
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WalletBalance {
  /** Funds instantly available for payout (90 % of all completed rentals) */
  availableBalance: number;
  /** Funds on hold (currently always 0.00 in the instant-credit model) */
  pendingBalance: number;
  /** Lifetime gross earnings (before fees) */
  totalSales: number;
  /** Cumulative amount already paid out to the host's bank account */
  paidOut: number;
}

export interface PayoutValidationResult {
  /** Whether the "+ Request Payout" button should be enabled */
  allowed: boolean;
  /** Human-readable status message shown in the UI warning tag */
  warningMessage: string | null;
  /** The effective net amount the host would receive (after R8.70 fee) */
  estimatedNetPayout: number;
}

// ---------------------------------------------------------------------------
// Constants (mirrored from server-side cron for consistency)
// ---------------------------------------------------------------------------

/** Minimum balance required before a payout can be requested */
export const MINIMUM_PAYOUT_FLOOR = 50.0;

/** Flat Payfast payout network fee deducted from availableBalance */
export const PAYOUT_NETWORK_FEE = 8.7;

/**
 * Day-of-week index for Tuesday (JavaScript: 0=Sunday, 1=Monday, 2=Tuesday).
 * We export this constant so frontend components can reference it directly
 * rather than magic-numbering their JSX.
 */
export const PAYOUT_DAY_INDEX = 2; // Tuesday

// ---------------------------------------------------------------------------
// UI warning message constants
// ---------------------------------------------------------------------------

export const WARNING_BELOW_MINIMUM =
  '⚠️ Minimum payout amount is R50 due to local banking network rules.';

export const WARNING_NOT_TUESDAY =
  '🗓️ Payouts unlock every Tuesday to bundle transfers and optimize network fees.';

// ---------------------------------------------------------------------------
// Core validation function
// ---------------------------------------------------------------------------

/**
 * Determines whether the "+ Request Payout" button should be enabled
 * and returns the appropriate warning message for the UI.
 *
 * Two conditions must BOTH be true:
 *   1. `availableBalance >= R50.00`   (Minimum Payout Floor)
 *   2. Current day is Tuesday         (Payout Window)
 *
 * @param balance - The host's wallet balance state from the database.
 * @param serverDate - Optional date override (for testing). Defaults to now.
 * @returns A PayoutValidationResult with `allowed`, `warningMessage`, and
 *          `estimatedNetPayout`.
 *
 * @example
 * ```tsx
 * const result = validatePayoutEligibility({
 *   availableBalance: 75.50,
 *   pendingBalance: 0,
 *   totalSales: 250.00,
 *   paidOut: 0,
 * });
 *
 * if (result.allowed) {
 *   // enable the button
 * } else {
 *   // show result.warningMessage under the button
 * }
 * ```
 */
export function validatePayoutEligibility(
  balance: WalletBalance,
  serverDate: Date = new Date(),
): PayoutValidationResult {
  const { availableBalance } = balance;

  // --- Condition 1: R50 minimum payout floor ----------------------------
  if (availableBalance < MINIMUM_PAYOUT_FLOOR) {
    return {
      allowed: false,
      warningMessage: WARNING_BELOW_MINIMUM,
      estimatedNetPayout: 0,
    };
  }

  // --- Condition 2: Tuesday-only window ---------------------------------
  const dayOfWeek = serverDate.getDay();

  if (dayOfWeek !== PAYOUT_DAY_INDEX) {
    return {
      allowed: false,
      warningMessage: WARNING_NOT_TUESDAY,
      estimatedNetPayout: Math.max(0, availableBalance - PAYOUT_NETWORK_FEE),
    };
  }

  // --- Both conditions met — payout is allowed ---------------------------
  const estimatedNetPayout =
    Math.round((availableBalance - PAYOUT_NETWORK_FEE) * 100) / 100;

  return {
    allowed: true,
    warningMessage: null,
    estimatedNetPayout: Math.max(0, estimatedNetPayout),
  };
}

// ---------------------------------------------------------------------------
// Helper: friendly day name for UI display
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable day name for display purposes.
 * Useful for showing "Payouts are next available on Tuesday" in the UI.
 */
export function getNextPayoutDayName(currentDayIndex?: number): string {
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const today = currentDayIndex ?? new Date().getDay();

  // If today is Tuesday, payouts are today
  if (today === PAYOUT_DAY_INDEX) {
    return 'today';
  }

  // Calculate days until next Tuesday
  const daysUntilTuesday = (PAYOUT_DAY_INDEX - today + 7) % 7;

  if (daysUntilTuesday === 1) {
    return 'tomorrow (Tuesday)';
  }

  return `on ${dayNames[PAYOUT_DAY_INDEX]} (in ${daysUntilTuesday} days)`;
}

// ---------------------------------------------------------------------------
// Helper: format ZAR currency for display
// ---------------------------------------------------------------------------

/**
 * Formats a number as South African Rand (ZAR) for UI display.
 * Example: formatZAR(50) → "R50.00"
 */
export function formatZAR(amount: number): string {
  return `R${amount.toFixed(2)}`;
}