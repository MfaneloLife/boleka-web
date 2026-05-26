import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPaymentsForMerchant } from '@/lib/neon-db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payments = await getPaymentsForMerchant(session.userId);
    const summary = {
      count: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
    };

    return NextResponse.json({ payments, summary });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}
