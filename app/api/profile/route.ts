import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/src/lib/firebase-admin';
import { userService } from '@/src/lib/firebase-db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring('Bearer '.length);
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userResult = await userService.getUserByEmail(email);

    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

  const user = userResult.user;

    // Return user profile data, excluding sensitive information
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      hasBusinessProfile: user.hasBusinessProfile,
    });
  } catch (error) {
    console.error('PROFILE_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
