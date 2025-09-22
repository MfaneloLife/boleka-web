import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FirebaseDbService } from '@/src/lib/firebase-db';

export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from Firebase
    const userResult = await FirebaseDbService.getUserByEmail(session.user.email);
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get business profile to check banking details
    const businessProfileResult = await FirebaseDbService.getBusinessProfileByUserId(userResult.user.id);
    if (!businessProfileResult.success || !businessProfileResult.profile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    // Get all successful payments for this merchant
    const paymentsResult = await FirebaseDbService.getPaymentsByMerchant(userResult.user.id);
    
    if (!paymentsResult.success) {
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    const payments = paymentsResult.payments || [];
    
    // Calculate summary
    const summary = {
      count: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      totalCommission: payments.reduce((sum, payment) => sum + payment.commissionAmount, 0),
      totalMerchantAmount: payments.reduce((sum, payment) => sum + payment.merchantAmount, 0)
    };

    // Extract banking details from business profile
    const bankingDetails = {
      bankName: businessProfileResult.profile.bankName || null,
      accountNumber: businessProfileResult.profile.accountNumber || null,
      accountType: businessProfileResult.profile.accountType || null,
      branchCode: businessProfileResult.profile.branchCode || null,
      accountHolderName: businessProfileResult.profile.accountHolderName || null
    };

    return NextResponse.json({
      payments,
      summary,
      bankingDetails
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}