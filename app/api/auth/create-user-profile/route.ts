import { NextRequest, NextResponse } from 'next/server';
import { upsertUserProfile } from '@/lib/neon-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, photoURL } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Missing required fields: email' },
        { status: 400 }
      );
    }

    const user = await upsertUserProfile({
      email,
      name: name || undefined,
      image: photoURL || undefined,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        message: 'User profile created or updated',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('CREATE_USER_PROFILE_ERROR', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
