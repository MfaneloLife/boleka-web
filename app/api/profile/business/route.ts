import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '../../auth/[...nextauth]/route';
import { userService, businessProfileService } from '@/src/lib/firebase-db';

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
    const { businessName, businessDescription, businessLocation, businessPhone } = body;

    if (!businessName || !businessLocation) {
      return NextResponse.json(
        { error: 'Business name and location are required' },
        { status: 400 }
      );
    }

    const user = await userService.getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if business profile already exists
    const existingProfile = await businessProfileService.getBusinessProfileByUserId(user.id);

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await businessProfileService.updateBusinessProfile(user.id, {
        businessName,
        description: businessDescription,
        location: businessLocation,
        contactPhone: businessPhone,
      });

      return NextResponse.json(updatedProfile, { status: 200 });
    } else {
      // Create new business profile
      const newProfile = await businessProfileService.createBusinessProfile({
        userId: user.id,
        businessName,
        description: businessDescription,
        location: businessLocation,
        contactPhone: businessPhone,
      });

      // Update user to indicate they have a business profile
      await userService.updateUser(user.id, {
        hasBusinessProfile: true,
      });

      return NextResponse.json(newProfile, { status: 201 });
    }
  } catch (error) {
    console.error('BUSINESS_PROFILE_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
