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
    const { clientProvince, clientCity, clientSuburb, cellPhone, preferences } = body;

    if (!clientProvince || !clientCity || !preferences) {
      return NextResponse.json(
        { error: 'Province, city, and preferences are required' },
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

    // Check if client profile already exists
    const existingProfileResult = await clientProfileService.getClientProfileByUserId(user.id);

    if (existingProfileResult.success && existingProfileResult.profile) {
      // Update existing profile
      const updateResult = await clientProfileService.updateClientProfile(user.id, {
        province: clientProvince,
        city: clientCity,
        suburb: clientSuburb,
        phone: cellPhone,
        preferences,
      });

      if (updateResult.success) {
        return NextResponse.json(updateResult.profile, { status: 200 });
      } else {
        return NextResponse.json({ error: updateResult.error }, { status: 500 });
      }
    } else {
      // Create new client profile
      const createResult = await clientProfileService.createClientProfile({
        userId: user.id,
        firstName: '', // Will be updated from session later
        lastName: '', // Will be updated from session later
        province: clientProvince,
        city: clientCity,
        suburb: clientSuburb,
        phone: cellPhone,
        preferences,
      });

      if (createResult.success) {
        return NextResponse.json({ id: createResult.id }, { status: 201 });
      } else {
        return NextResponse.json({ error: createResult.error }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('CLIENT_PROFILE_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
