import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPaymentsForMerchant } from '@/lib/neon-db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await getPaymentsForMerchant(userId);

    const summary = {
      count: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
    };

    const completedPayments = payments.filter((payment) => ['COMPLETED', 'PAID'].includes(payment.status));
    const pendingPayments = payments.filter((payment) => !['COMPLETED', 'PAID'].includes(payment.status));

    const paidOutTotal = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const availableBalance = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingBalance = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const completedSalesTotal = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const creditBalance = 0;
    const totalBalance = availableBalance + creditBalance + pendingBalance + paidOutTotal;

    const wallet = {
      availableBalance,
      creditBalance,
      pendingBalance,
      completedSalesTotal,
      paidOutTotal,
      totalBalance,
    };

    const bankingDetails = {
      bankName: null,
      accountNumber: null,
      accountType: null,
      branchCode: null,
      accountHolderName: null,
    };

    return NextResponse.json({ payments, summary, wallet, bankingDetails, hasBusinessProfile: false });
  } catch (error) {
    console.error('wallet.error', error);
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
  }
}
