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

    const userResult = await userService.getUserByEmail(session.user.email);

    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.user;

    // Check if business profile already exists
    const existingProfileResult = await businessProfileService.getBusinessProfileByUserId(user.id);

    if (existingProfileResult.success && existingProfileResult.profile) {
      // Update existing profile
      const updateResult = await businessProfileService.updateBusinessProfile(user.id, {
        businessName,
        description: businessDescription,
        address: businessLocation,
        phone: businessPhone,
      });

      if (updateResult.success) {
        return NextResponse.json(updateResult.profile, { status: 200 });
      } else {
        return NextResponse.json({ error: updateResult.error }, { status: 500 });
      }
    } else {
      // Create new business profile
      const createResult = await businessProfileService.createBusinessProfile({
        userId: user.id,
        businessName,
        description: businessDescription,
        category: 'general', // Default category
        address: businessLocation,
        phone: businessPhone,
        isVerified: false,
      });

      if (createResult.success) {
        // Update user to indicate they have a business profile
        await userService.updateUser(user.id, {
          hasBusinessProfile: true,
        });

        return NextResponse.json({ id: createResult.id }, { status: 201 });
      } else {
        return NextResponse.json({ error: createResult.error }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('BUSINESS_PROFILE_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
