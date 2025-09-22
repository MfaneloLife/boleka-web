import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/src/lib/firebase-admin';
import { userService, clientProfileService } from '@/src/lib/firebase-db';

// GET method to fetch client profile
export async function GET(request: NextRequest) {
  try {
    // Verify Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user by email
    const userResult = await userService.getUserByEmail(email);
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get client profile
    const profileResult = await clientProfileService.getClientProfileByUserId(userResult.user.id);
    if (!profileResult.success || !profileResult.profile) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }

    // Augment response with a synthetic `location` field for client UI compatibility
    const p: any = profileResult.profile as any;
    const location = [p.province, p.city, p.suburb].filter(Boolean).join(', ');
    return NextResponse.json({ ...p, location }, { status: 200 });
  } catch (error) {
    console.error('GET_CLIENT_PROFILE_ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT method to update client profile
export async function PUT(request: NextRequest) {
  try {
    // Verify Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, phone, location } = body;

    // Basic validation
    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    // Get user by email
    const userResult = await userService.getUserByEmail(email);
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse location into province/city/suburb if provided as a combined string
    let province = '';
    let city = '';
    let suburb = '';
    if (location && typeof location === 'string') {
      const parts = location.split(',').map((s: string) => s.trim());
      province = parts[0] || '';
      city = parts[1] || '';
      suburb = parts[2] || '';
    }

    // Update client profile
    const updateResult = await clientProfileService.updateClientProfile(userResult.user.id, {
      firstName,
      lastName,
      phone: phone || '',
      province,
      city,
      suburb,
    });

    if (updateResult.success && updateResult.profile) {
      const p: any = updateResult.profile as any;
      const newLocation = [p.province, p.city, p.suburb].filter(Boolean).join(', ');
      return NextResponse.json({ ...p, location: newLocation }, { status: 200 });
    } else {
      return NextResponse.json({ error: updateResult.error || 'Failed to update profile' }, { status: 500 });
    }
  } catch (error) {
    console.error('UPDATE_CLIENT_PROFILE_ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { clientProvince, clientCity, clientSuburb, cellPhone, preferences } = body;

    // For basic profiles, preferences is the only required field
    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences are required' },
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
