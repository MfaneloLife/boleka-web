import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating user profile...');
    const body = await request.json();
    const { uid, email, name, photoURL, provider } = body;
    console.log('Received data:', { uid, email, name, provider });

    if (!uid || !email) {
      console.error('Missing required fields:', { uid, email });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { clientProfile: true }
    });

    if (existingUser) {
      // Update existing user with Firebase UID if needed
      if (!existingUser.firebaseUid) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { firebaseUid: uid }
        });
      }

      // Create client profile if it doesn't exist
      if (!existingUser.clientProfile) {
        await prisma.clientProfile.create({
          data: {
            user: { connect: { id: existingUser.id } }
          }
        });
      }

      return NextResponse.json(
        { 
          user: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            firebaseUid: uid
          },
          message: 'User profile updated' 
        },
        { status: 200 }
      );
    }

    // Create new user
    try {
      console.log('Creating new user in database...');
      const user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0], // Use part of email as name if not provided
          firebaseUid: uid,
          image: photoURL,
          password: 'FIREBASE_AUTH_USER', // Dummy password as the schema requires it
          clientProfile: {
            create: {} // Create an empty client profile by default
          }
        },
      });
      
      console.log('User created successfully:', user.id);
      return NextResponse.json(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          message: 'User profile created'
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('Database error creating user:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to create user in database', 
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('CREATE_USER_PROFILE_ERROR', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
