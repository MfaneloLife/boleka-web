import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/neon-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body as { email?: string; name?: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const user = await createUser({
      email,
      name: name ?? undefined,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
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
