import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/src/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's stats
    const userEmail = session.user.email;
    
    // Get total items in the platform
    const itemsSnapshot = await adminDb.collection('items')
      .where('status', '==', 'available')
      .get();
    const totalItems = itemsSnapshot.size;

    // Get user's requests
    const requestsSnapshot = await adminDb.collection('requests')
      .where('requesterEmail', '==', userEmail)
      .get();
    const totalRequests = requestsSnapshot.size;

    // Get active rentals for user
    const activeRentalsSnapshot = await adminDb.collection('requests')
      .where('requesterEmail', '==', userEmail)
      .where('status', '==', 'accepted')
      .get();
    const activeRentals = activeRentalsSnapshot.size;

    // Get total earnings (if business user)
    let totalEarnings = 0;
    try {
      const paymentsSnapshot = await adminDb.collection('payments')
        .where('businessEmail', '==', userEmail)
        .where('status', '==', 'completed')
        .get();
      
      paymentsSnapshot.forEach(doc => {
        const payment = doc.data();
        totalEarnings += payment.merchantAmount || 0;
      });
    } catch (error) {
      console.log('No business earnings found');
    }

    const stats = {
      totalItems,
      totalRequests,
      totalEarnings,
      activeRentals
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
