import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const totalItems = await prisma.item.count({ where: { isActive: true } });
    const totalRequests = await prisma.request.count({ where: { requesterId: user.id } });
    const activeRentals = await prisma.request.count({ where: { requesterId: user.id, status: 'ACCEPTED' } });

    const merchantPayments = await prisma.payment.findMany({
      where: {
        request: {
          ownerId: user.id,
        },
        status: 'COMPLETED',
      },
      select: { amount: true },
    });

    const totalEarnings = merchantPayments.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0);

    const stats = {
      totalItems,
      totalRequests,
      totalEarnings,
      activeRentals,
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
