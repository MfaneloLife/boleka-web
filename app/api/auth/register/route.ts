import { NextRequest, NextResponse } from 'next/server';
import { FirebaseDbService } from '@/src/lib/firebase-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body as { email?: string; name?: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUserResult = await FirebaseDbService.getUserByEmail(email);
    if (existingUserResult.success) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // Create user without password (passwordless authentication)
    const userResult = await FirebaseDbService.createUser({
      email,
      name: name ?? undefined,
      hasBusinessProfile: false,
      authMethod: 'email' // Track that this user uses passwordless email auth
    });

    if (!userResult.success || !userResult.id) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create client profile with default values
    const clientProfileResult = await FirebaseDbService.createClientProfile({
      userId: userResult.id,
      firstName: name?.split(' ')[0] || '',
      lastName: name?.split(' ').slice(1).join(' ') || '',
      province: '', // Will be set during profile setup
      city: '', // Will be set during profile setup
      suburb: '', // Optional
      phone: '', // Optional
      preferences: '' // Will be set during profile setup
    });

    if (!clientProfileResult.success) {
      console.warn('Failed to create client profile for user:', userResult.id);
    }

    return NextResponse.json({ 
      user: { 
        id: userResult.id, 
        email, 
        name 
      } 
    }, { status: 201 });
  } catch (error) {
    console.error('REGISTRATION_ERROR', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
