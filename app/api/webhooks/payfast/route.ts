/**
 * --------------------------------------------------------------------------
 * Boleka Payfast ITN (Instant Transaction Notification) Webhook
 * --------------------------------------------------------------------------
 * POST /api/webhooks/payfast
 *
 * Payfast calls this URL server-to-server when a payment reaches a final
 * state (COMPLETE, CANCELLED, FAILED, etc.).  We:
 *
 *   1. Reconstruct and verify the MD5 signature to confirm the payload
 *      originated from Payfast (prevents spoofed IPN posts).
 *   2. Validate the payment_status is "COMPLETE".
 *   3. Look up the listing host via custom_str1 (listingId).
 *   4. Inside a Prisma $transaction:
 *      - Upsert the host's Wallet (create if not exists).
 *      - Instantly increment availableBalance by 90 % of the rental price.
 *      - Increment totalSales by the same 90 %.
 *      - Keep pendingBalance at 0.00 — funds are instantly available.
 *   5. Return a clean 200 OK so Payfast stops retrying the notify.
 *
 * SECURITY NOTES:
 *   - We do NOT rely on Clerk auth here because Payfast is the caller.
 *   - The MD5 signature verification is the sole trust anchor for ITN.
 *   - The host wallet status is left as "AVAILABLE" so it is immediately
 *     eligible for the Tuesday cron payout run.
 * --------------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import CryptoJS from 'crypto-js';

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID ?? '';
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? '';

// ---------------------------------------------------------------------------
// Types for the ITN payload we expect from Payfast
// ---------------------------------------------------------------------------
interface PayfastItnPayload {
  m_payment_id?: string;
  pf_payment_id?: string;
  payment_status?: string;
  amount_gross?: string;
  amount_fee?: string;
  amount_net?: string;
  custom_str1?: string; // listingId
  custom_str2?: string; // hostPayout (90 % of rental price — used for verification)
  custom_str3?: string; // renterId  — audit trail
  signature?: string;
  [key: string]: string | undefined;
}

// ---------------------------------------------------------------------------
// Signature verification (stateless — only relies on env vars)
// ---------------------------------------------------------------------------
function verifyPayfastSignature(
  payload: Record<string, string>,
  receivedSignature: string,
): boolean {
  // 1. Remove the signature key itself
  const { signature, ...fields } = payload;

  // 2. Build param string from alphabetically sorted keys (excluding signature)
  const sortedKeys = Object.keys(fields).sort();

  const paramString = sortedKeys
    .map((key) => {
      const value = fields[key] ?? '';
      return `${key}=${encodeURIComponent(String(value).trim())}`;
    })
    .join('&');

  // 3. Append passphrase
  const signatureString = `${paramString}&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE.trim())}`;

  // 4. Compute MD5
  const computed = CryptoJS.MD5(signatureString).toString(CryptoJS.enc.Hex);

  return computed === receivedSignature;
}

// ---------------------------------------------------------------------------
// POST handler — Payfast ITN endpoint
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // --- 1. Config guard ---------------------------------------------------
  if (!PAYFAST_MERCHANT_ID) {
    console.error('[payfast-webhook] Missing PAYFAST_MERCHANT_ID');
    return NextResponse.json(
      { error: 'Gateway config missing' },
      { status: 500 },
    );
  }

  // --- 2. Parse the form-urlencoded body Payfast sends -------------------
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error('[payfast-webhook] Failed to read request body:', err);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 },
    );
  }

  // Payfast sends application/x-www-form-urlencoded
  const params = new URLSearchParams(rawBody);
  const payload: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }

  const {
    payment_status,
    amount_gross,
    custom_str1: listingId,
    custom_str2: expectedHostPayoutRaw,
    custom_str3: renterId,
    signature: receivedSignature,
  } = payload as PayfastItnPayload;

  // --- 3. Signature verification -----------------------------------------
  if (!receivedSignature) {
    console.warn('[payfast-webhook] Missing signature in ITN payload');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  if (!verifyPayfastSignature(payload, receivedSignature)) {
    console.warn('[payfast-webhook] Invalid MD5 signature — possible spoofing');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  // --- 4. Only process COMPLETE payments ---------------------------------
  if (payment_status !== 'COMPLETE') {
    console.info(
      `[payfast-webhook] Ignoring payment_status="${payment_status}" — only COMPLETE matters`,
    );
    // Return 200 so Payfast doesn't keep retrying
    return NextResponse.json({ status: 'ignored' });
  }

  // --- 5. Validate core fields -------------------------------------------
  if (!listingId) {
    console.warn('[payfast-webhook] Missing custom_str1 (listingId)');
    return NextResponse.json({ error: 'Missing listing ID' }, { status: 400 });
  }

  const grossAmount = parseFloat(amount_gross ?? '0');
  if (!grossAmount || grossAmount <= 0) {
    console.warn(
      `[payfast-webhook] Invalid amount_gross="${amount_gross}" for listing ${listingId}`,
    );
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // --- 6. Compute host payout (90 %) & cross-verify against checkout data
  const hostPayout = Math.round(grossAmount * 0.9 * 100) / 100;

  // Verify that the host payout embedded at checkout time matches what we
  // independently compute here.  A mismatch indicates tampering or a stale
  // checkout payload — we still process but log the discrepancy loudly.
  const expectedHostPayout = parseFloat(expectedHostPayoutRaw ?? '0');
  if (expectedHostPayout > 0 && Math.abs(expectedHostPayout - hostPayout) > 0.05) {
    console.warn(
      `[payfast-webhook] ⚠️ Host-payout mismatch for listing ${listingId}: ` +
        `checkout said R${expectedHostPayout.toFixed(2)}, ` +
        `recomputed R${hostPayout.toFixed(2)} from amount_gross=${amount_gross}`,
    );
  }

  // --- 7. Look up listing to find the host (owner) -----------------------
  try {
    const listing = await prisma.item.findUnique({
      where: { id: listingId },
      select: { id: true, userId: true, price: true },
    });

    if (!listing) {
      console.warn(
        `[payfast-webhook] Listing ${listingId} not found for ITN`,
      );
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 },
      );
    }

    const hostId = listing.userId;

    // --- 8. Atomic wallet update inside a Prisma transaction -------------
    //
    // INSTANT CREDIT MODEL (Option 2):
    //   - availableBalance is incremented NOW (no 7-day pending holding tank).
    //   - pendingBalance stays at 0.00 for standard transactions.
    //   - totalSales is bumped so the host has a lifetime earnings tracker.
    //
    await prisma.$transaction(async (tx: Omit<Prisma.TransactionClient, '$transaction'>) => {
      // Upsert the wallet — create if the host doesn't have one yet
      const wallet = await tx.wallet.upsert({
        where: { userId: hostId },
        create: {
          userId: hostId,
          availableBalance: hostPayout,
          pendingBalance: 0,
          totalSales: hostPayout,
          payoutStatus: 'AVAILABLE',
        },
        update: {
          availableBalance: { increment: hostPayout },
          totalSales: { increment: hostPayout },
          // pendingBalance deliberately left unchanged (remains at whatever it was)
        },
      });

      console.info(
        `[payfast-webhook] Wallet ${wallet.id} (host=${hostId}) credited R${hostPayout.toFixed(2)} | ` +
          `listing=${listingId} | renter=${renterId ?? 'unknown'} | availableBalance= R${(wallet.availableBalance).toFixed(2)}`,
      );
    });

    // --- 9. Return clean 200 to Payfast ----------------------------------
    return NextResponse.json({ status: 'credited', hostPayout });
  } catch (error) {
    console.error(
      `[payfast-webhook] CRITICAL — failed to credit host for listing ${listingId}:`,
      error,
    );
    return NextResponse.json(
      { error: 'Internal server error — manual reconciliation required' },
      { status: 500 },
    );
  }
}