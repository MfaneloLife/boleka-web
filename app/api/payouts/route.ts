import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// API endpoint to list pending payouts for a business
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        businessProfile: true,
      },
    });

    if (!user || !user.hasBusinessProfile || !user.businessProfile) {
      return NextResponse.json(
        { error: 'Business profile not found' },
        { status: 404 }
      );
    }

    // Get pending payments for the business owner's items
    const pendingPayouts = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        merchantPaid: false,
        request: {
          ownerId: user.id,
        },
      },
      include: {
        request: {
          include: {
            item: true,
          },
        },
        payer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals
    const totalAmount = pendingPayouts.reduce((sum, payment) => sum + payment.amount, 0);
    const totalCommission = pendingPayouts.reduce((sum, payment) => sum + payment.commissionAmount, 0);
    const totalMerchantAmount = pendingPayouts.reduce((sum, payment) => sum + payment.merchantAmount, 0);

    return NextResponse.json({
      pendingPayouts,
      summary: {
        count: pendingPayouts.length,
        totalAmount,
        totalCommission,
        totalMerchantAmount,
      },
      bankingDetails: {
        bankName: user.businessProfile.bankName,
        accountNumber: user.businessProfile.accountNumber,
        accountType: user.businessProfile.accountType,
        branchCode: user.businessProfile.branchCode,
        accountHolderName: user.businessProfile.accountHolderName,
      },
    });
  } catch (error) {
    console.error('GET_PENDING_PAYOUTS_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Admin endpoint to mark payments as paid to the merchant
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In a real system, we would check if the user is an admin
    // For now, let's just update payments for testing
    const { paymentIds } = await request.json();

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: 'No payment IDs provided' },
        { status: 400 }
      );
    }

    // Update the payments as paid
    const updateResults = await prisma.payment.updateMany({
      where: {
        id: {
          in: paymentIds,
        },
        status: 'COMPLETED',
        merchantPaid: false,
      },
      data: {
        merchantPaid: true,
        merchantPayoutDate: new Date(),
      },
    });

    // Create notifications for each payment
    const payments = await prisma.payment.findMany({
      where: {
        id: {
          in: paymentIds,
        },
      },
      include: {
        request: true,
      },
    });

    for (const payment of payments) {
      await prisma.notification.create({
        data: {
          userId: payment.request.ownerId,
          type: 'PAYOUT_COMPLETED',
          title: 'Payout Processed',
          message: `Your payout of R${payment.merchantAmount.toFixed(2)} (after 5% platform fee) has been processed to your bank account.`,
          relatedId: payment.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      updatedCount: updateResults.count,
    });
  } catch (error) {
    console.error('PROCESS_PAYOUTS_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
