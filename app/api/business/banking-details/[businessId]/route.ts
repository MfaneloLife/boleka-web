import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { businessId } = params;
    
    // Get the business profile
    const businessProfileDoc = await adminDb.collection('businessProfiles').doc(businessId).get();
    
    // Check if business profile exists
    if (!businessProfileDoc.exists) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }
    
    const businessProfile = businessProfileDoc.data();
    
    // Get the user to check ownership
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', session.user.email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userDoc = usersSnapshot.docs[0];
    
    // Check if the user owns this business profile
    if (businessProfile?.userId !== userDoc.id) {
      return NextResponse.json({ error: 'You do not have permission to update this business profile' }, { status: 403 });
    }
    
    // Get banking details from request body
    const body = await request.json();
    const {
      bankName,
      accountNumber,
      accountType,
      branchCode,
      accountHolderName
    } = body;
    
    // Validate banking details
    if (!bankName || !accountNumber || !accountType || !branchCode || !accountHolderName) {
      return NextResponse.json({ error: 'All banking details are required' }, { status: 400 });
    }
    
    // Update business profile with banking details
    await businessProfileDoc.ref.update({
      bankName,
      accountNumber,
      accountType,
      branchCode,
      accountHolderName,
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      message: 'Banking details updated successfully',
      businessProfile: {
        id: businessProfileDoc.id,
        bankName,
        accountType
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating banking details:', error);
    return NextResponse.json({ 
      error: 'Failed to update banking details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
