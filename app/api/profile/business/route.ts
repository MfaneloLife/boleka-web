import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/src/lib/firebase-admin';
import { userService, businessProfileService } from '@/src/lib/firebase-db';

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid token provided' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { businessName, province, city, suburb, contactNumber, access } = body;

    if (!businessName || !province || !city || !suburb || !contactNumber || !access) {
      return NextResponse.json(
        { error: 'Business name, province, city, suburb, contact number, and access are required' },
        { status: 400 }
      );
    }

    const userResult = await userService.getUserByEmail(userEmail);

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
        province,
        city,
        suburb,
        phone: contactNumber,
        access,
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
        category: 'general', // Default category
        province,
        city,
        suburb,
        phone: contactNumber,
        access,
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
