import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { checkProfileCompletion } from '@/src/lib/profile-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check profile completion status
    const profileStatus = await checkProfileCompletion(session.user.id);

    return NextResponse.json(profileStatus);
  } catch (error) {
    console.error('PROFILE_CHECK_ERROR', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        needsProfileSetup: true,
        hasBusinessProfile: false,
        hasClientProfile: false,
        profileComplete: false
      },
      { status: 500 }
    );
  }
}
