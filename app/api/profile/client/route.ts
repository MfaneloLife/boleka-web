import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { userService, clientProfileService } from '@/src/lib/firebase-db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { address, contactPhone, preferences } = body;

    const user = await userService.getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if client profile already exists
    const existingProfile = await clientProfileService.getClientProfileByUserId(user.id);

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await clientProfileService.updateClientProfile(user.id, {
        address,
        contactPhone,
        preferences,
      });

      return NextResponse.json(updatedProfile, { status: 200 });
    } else {
      // Create new client profile
      const newProfile = await clientProfileService.createClientProfile({
        userId: user.id,
        address,
        contactPhone,
        preferences,
      });

      return NextResponse.json(newProfile, { status: 201 });
    }
  } catch (error) {
    console.error('CLIENT_PROFILE_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
