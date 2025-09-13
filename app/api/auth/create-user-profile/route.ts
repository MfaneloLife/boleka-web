import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase-admin';

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
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();

      // Update existing user with Firebase UID if needed
      if (!userData.firebaseUid) {
        await userDoc.ref.update({
          firebaseUid: uid,
          updatedAt: new Date()
        });
      }

      // Check if client profile exists
      const clientProfileSnapshot = await adminDb.collection('clientProfiles')
        .where('userId', '==', userDoc.id)
        .limit(1)
        .get();

      // Create client profile if it doesn't exist
      if (clientProfileSnapshot.empty) {
        await adminDb.collection('clientProfiles').add({
          userId: userDoc.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return NextResponse.json(
        { 
          user: {
            id: userDoc.id,
            name: userData.name,
            email: userData.email,
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
      const userRef = await adminDb.collection('users').add({
        email,
        name: name || email.split('@')[0], // Use part of email as name if not provided
        firebaseUid: uid,
        image: photoURL,
        provider: provider || 'firebase',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create client profile
      await adminDb.collection('clientProfiles').add({
        userId: userRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('User created successfully:', userRef.id);
      return NextResponse.json(
        {
          user: {
            id: userRef.id,
            name: name || email.split('@')[0],
            email: email,
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
