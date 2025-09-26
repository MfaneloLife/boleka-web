import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { adminAuth } from '@/src/lib/firebase-admin';
import { FirebaseDbService } from '@/src/lib/firebase-db';
import { logger } from '@/src/lib/logger';

/**
 * Wallet summary endpoint
 * Builds on payouts logic but returns additional balance segmentation.
 * For now, credits (bolekaCredit) are placeholder (0) until a credit ledger is implemented.
 */
export async function GET(request: NextRequest) {
  try {
  const authHeader = request.headers.get('authorization');
  logger.debug('wallet.start', { hasAuthHeader: !!authHeader });
    let userEmail: string | null = null;
    let firebaseUid: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.substring('Bearer '.length);
        const decoded = await adminAuth.verifyIdToken(idToken);
        userEmail = decoded.email ?? null;
        firebaseUid = decoded.uid ?? null;
        logger.debug('wallet.tokenDecoded', { firebaseUid, userEmailKnown: !!userEmail });
      } catch (e) {
        // ignore – will fall back
        logger.warn('wallet.tokenDecodeFailed');
      }
    }

    if (!userEmail) {
      const headerEmail = request.headers.get('x-user-email');
      if (headerEmail) userEmail = headerEmail;
    }

    if (!userEmail) {
      const session = await getServerSession(authOptions);
      if (session?.user?.email) userEmail = session.user.email;
      logger.debug('wallet.sessionLookup', { sessionFound: !!session, userEmailFound: !!userEmail });
    }

    if (!userEmail && !firebaseUid) {
      logger.warn('wallet.unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve user by email first, then by firebase UID fallback
    let userResult;
    if (userEmail) {
      userResult = await FirebaseDbService.getUserByEmail(userEmail);
    }
    if ((!userResult || !userResult.success || !userResult.user) && firebaseUid) {
      userResult = await FirebaseDbService.getUserByFirebaseUid(firebaseUid);
    }
    if (!userResult?.success || !userResult.user) {
      logger.warn('wallet.userNotFound', { userEmail, firebaseUid });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.user.id;
    // Backfill firebaseUid on legacy user records for future direct lookups
    if (firebaseUid && !userResult.user.firebaseUid) {
      try { await FirebaseDbService.updateUser(userId, { firebaseUid }); logger.info('wallet.backfillFirebaseUid', { userId }); } catch { /* ignore */ }
    }

    // Business profile (for banking details)
    const businessProfileResult = await FirebaseDbService.getBusinessProfileByUserId(userId);
    // Do not hard error if business profile missing; allow wallet to load with empty banking details
    const hasBusinessProfile = !!(businessProfileResult.success && businessProfileResult.profile);

    // Payments for merchant
    const paymentsResult = await FirebaseDbService.getPaymentsByMerchant(userId);
    const payments = paymentsResult.success ? (paymentsResult.payments || []) : [];

    // Basic payouts style summary
    const summary = {
      count: payments.length,
      totalAmount: payments.reduce((s, p) => s + p.amount, 0),
      totalCommission: payments.reduce((s, p) => s + p.commissionAmount, 0),
      totalMerchantAmount: payments.reduce((s, p) => s + p.merchantAmount, 0)
    };

    // Wallet segmentation
    const completedPayments = payments.filter(p => ['COMPLETED', 'PAID'].includes(p.status));
    const pendingPayments = payments.filter(p => !['COMPLETED', 'PAID'].includes(p.status));

    const paidOutTotal = completedPayments.filter(p => p.merchantPaid).reduce((s, p) => s + p.merchantAmount, 0);
    const availableBalance = completedPayments.filter(p => !p.merchantPaid).reduce((s, p) => s + p.merchantAmount, 0);
    const pendingBalance = pendingPayments.reduce((s, p) => s + p.merchantAmount, 0);
    const completedSalesTotal = completedPayments.reduce((s, p) => s + p.merchantAmount, 0);
    const creditBalance = 0; // Placeholder until credit ledger implemented
    const totalBalance = availableBalance + creditBalance + pendingBalance + paidOutTotal;

    const wallet = {
      availableBalance,
      creditBalance,
      pendingBalance,
      completedSalesTotal,
      paidOutTotal,
      totalBalance
    };

    const bankingDetails = hasBusinessProfile ? {
      bankName: businessProfileResult.profile!.bankName || null,
      accountNumber: businessProfileResult.profile!.accountNumber || null,
      accountType: businessProfileResult.profile!.accountType || null,
      branchCode: businessProfileResult.profile!.branchCode || null,
      accountHolderName: businessProfileResult.profile!.accountHolderName || null
    } : {
      bankName: null,
      accountNumber: null,
      accountType: null,
      branchCode: null,
      accountHolderName: null
    };

    logger.debug('wallet.success', { paymentCount: payments.length, hasBusinessProfile });
    return NextResponse.json({ payments, summary, wallet, bankingDetails, hasBusinessProfile });
  } catch (error) {
    logger.error('wallet.error', { error: (error as any)?.message });
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}
