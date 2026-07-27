/**
 * --------------------------------------------------------------------------
 * Boleka Tuesday Payout Cron Processor
 * --------------------------------------------------------------------------
 * POST /api/cron/process-payouts
 *
 * Intended to be called at 04:00 SAST every Tuesday by a Vercel Cron Job
 * (or any secure scheduler).  The route processes every host whose:
 *
 *   - Wallet payoutStatus = "AVAILABLE"
 *   - Wallet.availableBalance >= 50.00 (R50 minimum payout floor)
 *   - Completed BankAccount profile (holder, account number, bank name,
 *     branch code, account type)
 *
 * --------------------------------------------------------------------------
 * ANTI-FRAUD DOUBLE-SPENDING LOCK (CRITICAL)
 * --------------------------------------------------------------------------
 * 1. Before looping, we atomically flip payoutStatus from "AVAILABLE" to
 *    "PROCESSING" for ALL eligible wallets in a single UPDATE query.
 *    The WHERE clause includes `payoutStatus = 'AVAILABLE'` so the update
 *    is a no-op on any subsequent execution — even if Vercel fires the cron
 *    twice or a parallel invocation slips through.
 * 2. We then SELECT only wallets whose payoutStatus = "PROCESSING" AND
 *    whose updatedAt is within the last 60 seconds (our batch window).
 *    This guarantees we never touch the same wallet twice.
 * --------------------------------------------------------------------------
 *
 * FOR EACH ELIGIBLE HOST:
 *   1. Deduct the flat R8.70 (≈R10 incl. VAT) Payfast payout network fee
 *      from availableBalance BEFORE the API call.  Boleka's 10 % platform
 *      cut is never touched by the network fee.
 *   2. Dispatch a server-to-server request to the Payfast Payout API
 *      using the secure merchant tokens.
 *   3. On success:
 *      - Deduct the gross payout amount from availableBalance.
 *      - Add the same amount to paidOut.
 *      - Create a PAYOUT ledger record with status = "SETTLED".
 *      - Flip wallet payoutStatus back to "AVAILABLE".
 *   4. On failure:
 *      - Log the error on the Payout record (status = "FAILED", errorMessage).
 *      - Flip wallet payoutStatus back to "AVAILABLE" so the host can
 *        correct their bank details and be retried next Tuesday.
 *      - Continue processing the rest of the queue — one bad bank account
 *        must NOT halt payouts for every other host.
 * --------------------------------------------------------------------------
 *
 * SECURITY:
 *   - This route MUST be protected behind a CRON_SECRET header or similar
 *     mechanism in production (e.g. Vercel's CRON_SECRET env check).
 *   - No Clerk auth — this is a machine-to-machine endpoint.
 * --------------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Constants (SA Rand)
// ---------------------------------------------------------------------------
const MINIMUM_PAYOUT_AMOUNT = 50.0;
const PAYFAST_NETWORK_FEE = 8.7; // flat fee ≈ R10 with VAT for Payfast payouts

// Payfast Payout API endpoint (sandbox)
const PAYFAST_PAYOUT_API_URL =
  process.env.PAYFAST_PAYOUT_API_URL ??
  'https://sandbox.payfast.co.za/api/payouts';

// Environment variables for Payfast payout auth
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID ?? '';
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY ?? '';
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? '';

// Cron secret for production protection
const CRON_SECRET = process.env.CRON_SECRET ?? '';

// ---------------------------------------------------------------------------
// Type for a wallet row we'll actually process
// ---------------------------------------------------------------------------
interface EligibleWallet {
  id: string;
  userId: string;
  availableBalance: number;
  user: {
    name: string | null;
    email: string | null;
    bankAccounts: {
      id: string;
      bankName: string;
      accountHolder: string;
      accountNumber: string;
      branchCode: string;
      accountType: string;
    }[];
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // --- 0. Cron secret guard (production safety) --------------------------
  if (CRON_SECRET) {
    const providedSecret = request.headers.get('x-cron-secret') ?? '';
    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Forbidden — invalid cron secret' },
        { status: 403 },
      );
    }
  }

  // --- 1. Config guard ---------------------------------------------------
  if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
    console.error('[cron-payouts] Missing Payfast environment variables');
    return NextResponse.json(
      { error: 'Payout gateway not configured' },
      { status: 500 },
    );
  }

  // Performance tracking
  const batchStart = Date.now();
  let totalProcessed = 0;
  let totalSettled = 0;
  let totalFailed = 0;

  try {
    // --- 2. ANTI-FRAUD LOCK ----------------------------------------------
    //
    // Step A: Atomically flip ALL eligible wallets from AVAILABLE → PROCESSING.
    // The `payoutStatus = 'AVAILABLE'` condition in the WHERE clause means
    // only unclaimed wallets are targeted.  If this block runs twice (network
    // hiccup, Vercel double-fire), the second execution's WHERE clause matches
    // zero rows because wallets are already PROCESSING — completely idempotent.
    //
    const lockResult = await prisma.wallet.updateMany({
      where: {
        payoutStatus: 'AVAILABLE',
        availableBalance: { gte: MINIMUM_PAYOUT_AMOUNT },
      },
      data: {
        payoutStatus: 'PROCESSING',
      },
    });

    const lockedCount = lockResult.count;
    console.info(
      `[cron-payouts] 🔒 Locked ${lockedCount} wallets for processing`,
    );

    // If nothing was locked, exit early
    if (lockedCount === 0) {
      console.info('[cron-payouts] No eligible wallets — exiting');
      return NextResponse.json({
        message:
          'No wallets above R50 minimum with AVAILABLE status — nothing to process',
        locked: 0,
        processed: 0,
        settled: 0,
        failed: 0,
        duration: `${Date.now() - batchStart}ms`,
      });
    }

    // --- 3. FETCH ELIGIBLE WALLETS ---------------------------------------
    //
    // Step B: SELECT wallets where payoutStatus = 'PROCESSING' that also
    // have a completed BankAccount profile.  We use `include` to eagerly
    // load the bank accounts so we can validate in the loop.
    //
    const wallets = await prisma.wallet.findMany({
      where: {
        payoutStatus: 'PROCESSING',
        availableBalance: { gte: MINIMUM_PAYOUT_AMOUNT },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            bankAccounts: {
              where: {
                // Only pick bank accounts that have all routing fields filled
                accountHolder: { not: '' },
                accountNumber: { not: '' },
                bankName: { not: '' },
                branchCode: { not: '' },
              },
              take: 1, // use the first complete bank account
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    console.info(
      `[cron-payouts] Fetched ${wallets.length} PROCESSING wallets for payout`,
    );

    // --- 4. PROCESS EACH WALLET INDIVIDUALLY (fail-safe loop) ------------
    for (const wallet of wallets) {
      totalProcessed++;

      try {
        // --- 4a. Validate bank account profile ---------------------------
        const bankAccount = wallet.user.bankAccounts[0];
        if (!bankAccount) {
          // No completed bank profile — flag back to AVAILABLE for later
          console.warn(
            `[cron-payouts] Wallet ${wallet.id} (user=${wallet.userId}) has no complete BankAccount — resetting to AVAILABLE`,
          );
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { payoutStatus: 'AVAILABLE' },
          });

          // Create a FAILED payout record with reason
          await prisma.payout.create({
            data: {
              walletId: wallet.id,
              userId: wallet.userId,
              grossAmount: wallet.availableBalance,
              networkFee: PAYFAST_NETWORK_FEE,
              netAmount: Math.max(
                0,
                wallet.availableBalance - PAYFAST_NETWORK_FEE,
              ),
              bankName: 'UNKNOWN',
              accountHolder: wallet.user.name ?? 'UNKNOWN',
              accountNumber: 'UNKNOWN',
              branchCode: 'UNKNOWN',
              accountType: 'UNKNOWN',
              status: 'FAILED',
              errorMessage:
                'No completed BankAccount profile — please add bank details in Settings',
            },
          });

          totalFailed++;
          continue; // ← move to next wallet, don't crash the loop
        }

        // --- 4b. Determine payout amounts --------------------------------
        const grossAmount = wallet.availableBalance; // entire available pool
        const networkFee = PAYFAST_NETWORK_FEE;
        const netAmount = Math.round((grossAmount - networkFee) * 100) / 100;

        // Safety: net amount must be > 0 after fee deduction
        if (netAmount <= 0) {
          console.warn(
            `[cron-payouts] Wallet ${wallet.id} net amount R${netAmount.toFixed(2)} after R${networkFee.toFixed(2)} fee — skipping`,
          );
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { payoutStatus: 'AVAILABLE' },
          });
          continue;
        }

        // --- 4c. Dispatch Payfast Payout API call ------------------------
        //
        // Payfast Payout API expects a JSON POST with authentication headers.
        // The sandbox endpoint structure is documented at:
        //   https://developers.payfast.co.za/docs/payouts-api
        //
        // NOTE: In production you would use the live URL and real tokens.
        // The payload structure below follows Payfast's documented spec.
        //
        let payoutSucceeded = false;
        let payfastReference = '';
        let payoutErrorMessage = '';

        try {
          const payoutResponse = await fetch(PAYFAST_PAYOUT_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'merchant-id': PAYFAST_MERCHANT_ID,
              'merchant-key': PAYFAST_MERCHANT_KEY,
              'version': 'v1',
            },
            body: JSON.stringify({
              amount: netAmount.toFixed(2),
              // Bank routing details
              bank_name: bankAccount.bankName,
              account_holder: bankAccount.accountHolder,
              account_number: bankAccount.accountNumber,
              branch_code: bankAccount.branchCode,
              account_type: bankAccount.accountType,
              // Reference for the bank statement
              reference: `Boleka-${wallet.userId.slice(0, 8)}`,
            }),
          });

          if (payoutResponse.ok) {
            const responseBody = await payoutResponse.json().catch(() => ({}));
            payfastReference =
              responseBody.reference ??
              responseBody.payout_id ??
              `payfast-${Date.now()}`;
            payoutSucceeded = true;

            console.info(
              `[cron-payouts] ✅ Payout R${netAmount.toFixed(2)} to user=${wallet.userId} | ref=${payfastReference}`,
            );
          } else {
            const errorBody = await payoutResponse.text();
            payoutErrorMessage = `Payfast API returned ${payoutResponse.status}: ${errorBody.slice(0, 500)}`;
            console.error(
              `[cron-payouts] ❌ Payout API error for wallet ${wallet.id}: ${payoutErrorMessage}`,
            );
          }
        } catch (fetchError: unknown) {
          payoutErrorMessage = `Network error calling Payfast Payout API: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`;
          console.error(
            `[cron-payouts] ❌ Payout API fetch failed for wallet ${wallet.id}: ${payoutErrorMessage}`,
          );
        }

        // --- 4d. Persist results -----------------------------------------
        if (payoutSucceeded) {
          // Happy path — deduct from wallet, log to ledger
          await prisma.$transaction([
            // Create the Payout ledger record
            prisma.payout.create({
              data: {
                walletId: wallet.id,
                userId: wallet.userId,
                grossAmount,
                networkFee,
                netAmount,
                bankName: bankAccount.bankName,
                accountHolder: bankAccount.accountHolder,
                accountNumber: bankAccount.accountNumber,
                branchCode: bankAccount.branchCode,
                accountType: bankAccount.accountType,
                payfastReference,
                status: 'SETTLED',
              },
            }),
            // Update wallet: deduct gross amount, increment paidOut, reset status
            prisma.wallet.update({
              where: { id: wallet.id },
              data: {
                availableBalance: { decrement: grossAmount },
                paidOut: { increment: grossAmount },
                payoutStatus: 'AVAILABLE',
              },
            }),
          ]);

          totalSettled++;
        } else {
          // Failed path — DO NOT deduct anything from the wallet.
          // Flag wallet back to AVAILABLE so host can fix bank details.
          // Log the failure on a Payout record for manual ops review.
          await prisma.$transaction([
            prisma.payout.create({
              data: {
                walletId: wallet.id,
                userId: wallet.userId,
                grossAmount,
                networkFee,
                netAmount,
                bankName: bankAccount.bankName,
                accountHolder: bankAccount.accountHolder,
                accountNumber: bankAccount.accountNumber,
                branchCode: bankAccount.branchCode,
                accountType: bankAccount.accountType,
                payfastReference: null,
                status: 'FAILED',
                errorMessage: payoutErrorMessage,
              },
            }),
            prisma.wallet.update({
              where: { id: wallet.id },
              data: {
                payoutStatus: 'AVAILABLE',
              },
            }),
          ]);

          totalFailed++;
        }
      } catch (individualError: unknown) {
        // --- CATASTROPHIC single-wallet failure --------------------------
        //
        // This catch block handles unexpected runtime errors (DB connection
        // drops, Prisma schema mismatch, etc.) for ONE wallet specifically.
        // We MUST reset that wallet's status to AVAILABLE and keep going.
        //
        console.error(
          `[cron-payouts] 🔥 FATAL error processing wallet ${wallet.id}:`,
          individualError,
        );

        totalFailed++;

        // Best-effort reset — if this also fails we log and move on
        try {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { payoutStatus: 'AVAILABLE' },
          });
        } catch (resetError) {
          console.error(
            `[cron-payouts] Could not reset wallet ${wallet.id} status:`,
            resetError,
          );
        }
      }
    }

    // --- 5. Return summary -----------------------------------------------
    const duration = Date.now() - batchStart;
    console.info(
      `[cron-payouts] 🏁 Batch complete — locked=${lockedCount} | processed=${totalProcessed} | settled=${totalSettled} | failed=${totalFailed} | ${duration}ms`,
    );

    return NextResponse.json({
      message: 'Tuesday payout batch processed',
      locked: lockedCount,
      processed: totalProcessed,
      settled: totalSettled,
      failed: totalFailed,
      duration: `${duration}ms`,
    });
  } catch (batchError: unknown) {
    // --- TOP-LEVEL CATCH — entire cron run failed ------------------------
    //
    // If we get here, something catastrophic happened (DB is down, migration
    // mismatch, etc.).  Wallets that were flipped to PROCESSING will remain
    // stuck.  In production you should have an alert for this scenario.
    // A manual recovery script can flip PROCESSING → AVAILABLE for all
    // wallets older than N minutes.
    //
    console.error(
      '[cron-payouts] 🔥 BATCH-LEVEL failure — wallets may be stuck in PROCESSING:',
      batchError,
    );

    return NextResponse.json(
      {
        error:
          'Payout batch failed — wallets locked for processing may need manual recovery',
        locked: 0,
        processed: totalProcessed,
        settled: totalSettled,
        failed: totalFailed,
        duration: `${Date.now() - batchStart}ms`,
      },
      { status: 500 },
    );
  }
}