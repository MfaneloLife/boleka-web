import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the user's email
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }
    
    // Find the user
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', userEmail)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userDoc = usersSnapshot.docs[0];
    
    // Find the user's business profile
    const businessProfileSnapshot = await adminDb.collection('businessProfiles')
      .where('userId', '==', userDoc.id)
      .limit(1)
      .get();
    
    // Check if user has a business profile
    if (businessProfileSnapshot.empty) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }
    
    const businessProfileDoc = businessProfileSnapshot.docs[0];
    const businessProfile = {
      id: businessProfileDoc.id,
      ...businessProfileDoc.data()
    };
    
    // Return the business profile
    return NextResponse.json(businessProfile, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch business profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
