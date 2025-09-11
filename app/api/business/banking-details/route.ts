import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { FirebaseDbService } from '@/src/lib/firebase-db';

export async function PUT(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { bankName, accountNumber, accountType, branchCode, accountHolderName } = body;

    // Validate required fields
    if (!bankName || !accountNumber || !accountType || !branchCode || !accountHolderName) {
      return NextResponse.json(
        { error: 'All banking details are required' },
        { status: 400 }
      );
    }

    // Update business profile with banking details
    const updateResult = await FirebaseDbService.updateBusinessProfile(userResult.user.id, {
      bankName,
      accountNumber,
      accountType,
      branchCode,
      accountHolderName
    });

    if (!updateResult.success) {
      return NextResponse.json(
        { error: 'Failed to update banking details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Banking details updated successfully',
      profile: updateResult.profile
    });
  } catch (error) {
    console.error('Error updating banking details:', error);
    return NextResponse.json(
      { error: 'Failed to update banking details' },
      { status: 500 }
    );
  }
}
