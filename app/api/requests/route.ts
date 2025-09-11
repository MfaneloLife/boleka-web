import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'sent' or 'received'
    
    // Create the appropriate query based on the type
    let requestsQuery;
    if (type === 'sent') {
      // Get requests sent by this user (as requester)
      requestsQuery = query(
        collection(db, 'requests'),
        where('requesterEmail', '==', session.user.email),
        orderBy('createdAt', 'desc')
      );
    } else {
      // Get requests received by this user (as owner)
      requestsQuery = query(
        collection(db, 'requests'),
        where('ownerEmail', '==', session.user.email),
        orderBy('createdAt', 'desc')
      );
    }

    const requestsSnapshot = await getDocs(requestsQuery);
    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}