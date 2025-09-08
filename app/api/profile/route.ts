import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../auth/[...nextauth]/route';
import { userService } from '@/src/lib/firebase-db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await userService.getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user profile data, excluding sensitive information
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      hasBusinessProfile: user.hasBusinessProfile,
      businessProfile: user.businessProfile ? {
        id: user.businessProfile.id,
        businessName: user.businessProfile.businessName,
        description: user.businessProfile.description,
        location: user.businessProfile.location,
        contactPhone: user.businessProfile.contactPhone,
      } : null,
      clientProfile: user.clientProfile ? {
        id: user.clientProfile.id,
        address: user.clientProfile.address,
        contactPhone: user.clientProfile.contactPhone,
        preferences: user.clientProfile.preferences,
      } : null,
    });
  } catch (error) {
    console.error('PROFILE_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
