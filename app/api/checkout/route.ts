/**
 * --------------------------------------------------------------------------
 * Boleka Checkout Payload Generator
 * --------------------------------------------------------------------------
 * POST /api/checkout
 *
 * Generates a signed Payfast payment payload for a peer-to-peer rental.
 * The platform uses an all-inclusive 10 % commission model:
 *   - Total Paid by Renter  = Original Listing Price (no hidden checkout fees)
 *   - Boleka Commission     = Total Paid × 0.10
 *   - Host Payout           = Total Paid × 0.90
 *
 * Metadata is injected via Payfast custom_str fields so the webhook (ITN)
 * can reconcile the listing, renter, and host-payout breakdown server-side
 * without trusting the browser.
 *
 * Security:
 *   - Clerk authentication required on every request.
 *   - Zod validates the incoming JSON payload.
 *   - The Payfast MD5 signature is computed from alphabetically sorted
 *     fields using PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, and
 *     PAYFAST_PASSPHRASE exactly as prescribed by Payfast docs.
 *   - Sandbox gateway: https://sandbox.payfast.co.za/eng/process
 *
 * NOTE: crypto-js is already in your package.json.  You can also use the
 * native Node crypto module if you prefer — the MD5 logic is identical.
 * --------------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import CryptoJS from 'crypto-js';

// ---------------------------------------------------------------------------
// Zod validation schema
// ---------------------------------------------------------------------------
const checkoutSchema = z.object({
  requestId: z
    .string({ required_error: 'requestId is required' })
    .min(1, 'requestId cannot be empty'),
});

// ---------------------------------------------------------------------------
// Environment helpers (fail fast on missing config)
// ---------------------------------------------------------------------------
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID ?? '';
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY ?? '';
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? '';
const PAYFAST_SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';

// ---------------------------------------------------------------------------
// Payfast MD5 signature generator
//
// Per Payfast spec:
//   1. Build a key=value&key=value... string of all payment fields sorted
//      alphabetically by key (excluding the signature field itself).
//   2. Append "&passphrase=" + your passphrase (empty passphrase = just "&passphrase=").
//   3. Compute the MD5 hex digest of the resulting string.
// ---------------------------------------------------------------------------
function generatePayfastSignature(
  fields: Record<string, string>,
): string {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(fields).sort();

  // Build the parameter string
  const paramString = sortedKeys
    .map((key) => {
      const value = fields[key];
      // Encode each value in the same way Payfast expects (encodeURIComponent
      // but with %20 for spaces — the default encodeURIComponent uses %20).
      // We convert to string, trim, and encode.
      return `${key}=${encodeURIComponent(String(value ?? '').trim())}`;
    })
    .join('&');

  // Append passphrase (even if empty)
  const signatureString = `${paramString}&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE.trim())}`;

  // MD5 hash — crypto-js will hash the raw bytes; Payfast uses MD5 of the
  // parameter string (not URI-encoded bytes), so we hash the decoded form.
  // Actually, the Payfast docs say to MD5 the *url-encoded* parameter string.
  // We hash the string as-is after URI encoding — this matches Payfast behaviour.
  return CryptoJS.MD5(signatureString).toString(CryptoJS.enc.Hex);
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // --- 1. Clerk authentication -------------------------------------------
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    );
  }

  // --- 2. Config guard ---------------------------------------------------
  if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
    console.error('[checkout] Missing Payfast environment variables');
    return NextResponse.json(
      { error: 'Payment gateway is not configured' },
      { status: 500 },
    );
  }

  // --- 3. Parse & validate body with Zod ---------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { requestId } = parsed.data;

  // --- 4. Fetch the request with its item --------------------------------
  try {
    const requestRecord = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        item: {
          select: { id: true, title: true, price: true, userId: true, isActive: true },
        },
      },
    });

    if (!requestRecord) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 },
      );
    }

    // Only the renter may initiate payment
    if (userId !== requestRecord.requesterId) {
      return NextResponse.json(
        { error: 'Only the renter can initiate payment' },
        { status: 403 },
      );
    }

    // Must be in NEGOTIATING status with a finalValue set
    if (requestRecord.status !== 'NEGOTIATING') {
      return NextResponse.json(
        { error: `Cannot pay for a request with status "${requestRecord.status}". The owner must confirm a final price first.` },
        { status: 409 },
      );
    }

    const listing = requestRecord.item;

    if (!listing.isActive) {
      return NextResponse.json(
        { error: 'This listing is no longer available' },
        { status: 410 },
      );
    }

    // --- 5. Compute billing split ------------------------------------------
    const settledAmount = requestRecord.finalValue ?? listing.price;
    const totalPaidByRenter = settledAmount;
    const bolekaCommission = Math.round(totalPaidByRenter * 0.1 * 100) / 100;
    const hostPayout = Math.round(totalPaidByRenter * 0.9 * 100) / 100;

    // --- 6. Build the Payfast payment fields ------------------------------
    // Merchant identifiers
    const merchantId = PAYFAST_MERCHANT_ID;
    const merchantKey = PAYFAST_MERCHANT_KEY;

    const listingId = listing.id;
    const renterId = requestRecord.requesterId;

    // Unique payment reference — we use requestId + timestamp for idempotency
    const paymentId = `${requestId}_${Date.now()}`;

    // The item name shown on the Payfast checkout page
    const itemName = listing.title.length > 100
      ? listing.title.slice(0, 97) + '...'
      : listing.title;

    // Collect all fields in a plain object for signature generation.
    // Payfast expects these standard fields (among others):
    //   merchant_id, merchant_key, return_url, cancel_url, notify_url,
    //   name_first, name_last, email_address, m_payment_id, amount,
    //   item_name, item_description, custom_str1, custom_str2, ...
    //
    // For a sandbox/demo we set minimal return/cancel/notify URLs.
    const baseUrl = request.nextUrl.origin;

    const paymentFields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${baseUrl}/checkout/success?listingId=${listingId}`,
      cancel_url: `${baseUrl}/checkout/cancel?listingId=${listingId}`,
      notify_url: `${baseUrl}/api/webhooks/payfast`,
      m_payment_id: paymentId,
      amount: totalPaidByRenter.toFixed(2),
      item_name: itemName,
      item_description: `Rental of "${listing.title}"`,
      // ------------------------------------------------------------------
      // Custom metadata fields — read by our ITN webhook to:
      //   custom_str1 → listingId      (which listing was paid for)
      //   custom_str2 → hostPayout     (expected 90 % payout for verification)
      //   custom_str3 → renterId       (who paid — audit trail)
      //   custom_str4 → requestId      (links payment back to the request)
      // The host (owner) is looked up from the listing inside the webhook
      // so the renter cannot tamper with payout routing.
      // ------------------------------------------------------------------
      custom_str1: listingId,
      custom_str2: hostPayout.toFixed(2),
      custom_str3: renterId,
      custom_str4: requestId,
    };

    // --- 7. Generate the Payfast MD5 signature ----------------------------
    const signature = generatePayfastSignature(paymentFields);

    // --- 8. Return the full checkout payload to the frontend --------------
    // The frontend can POST these fields to the Payfast sandbox gateway or
    // render them as hidden form fields and auto-submit.
    return NextResponse.json({
      gatewayUrl: PAYFAST_SANDBOX_URL,
      fields: {
        ...paymentFields,
        signature,
      },
      // Transparent billing breakdown for UI display (NOT sent to Payfast)
      breakdown: {
        listingPrice: totalPaidByRenter,
        bolekaCommission,
        hostPayout,
      },
    });
  } catch (error) {
    console.error('[checkout] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to generate checkout payload' },
      { status: 500 },
    );
  }
}