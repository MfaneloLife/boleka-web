import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { FirebaseDbService } from '@/src/lib/firebase-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body as { email?: string; name?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUserResult = await FirebaseDbService.getUserByEmail(email);
    if (existingUserResult.success) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userResult = await FirebaseDbService.createUser({
      email,
      name: name ?? undefined,
      password: hashedPassword,
      hasBusinessProfile: false
    });

    if (!userResult.success || !userResult.id) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create client profile
    const clientProfileResult = await FirebaseDbService.createClientProfile({
      userId: userResult.id,
      firstName: name?.split(' ')[0] || '',
      lastName: name?.split(' ').slice(1).join(' ') || ''
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
