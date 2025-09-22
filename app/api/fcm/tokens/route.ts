import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/src/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, userId, deviceInfo } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // Ensure user can only save their own token
    const targetUserId = userId || session.user.id;
    if (targetUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if token already exists
    const existingTokenQuery = await adminDb
      .collection('fcm_tokens')
      .where('token', '==', token)
      .where('userId', '==', targetUserId)
      .limit(1)
      .get();

    if (!existingTokenQuery.empty) {
      // Update existing token
      const docId = existingTokenQuery.docs[0].id;
      await adminDb
        .collection('fcm_tokens')
        .doc(docId)
        .update({
          lastUsed: Timestamp.now(),
          deviceInfo: {
            ...deviceInfo,
            lastUpdated: Date.now()
          }
        });

      return NextResponse.json({
        success: true,
        message: 'FCM token updated',
        tokenId: docId
      });
    }

    // Create new token record
    const tokenRecord = {
      token,
      userId: targetUserId,
      userEmail: session.user.email,
      deviceInfo: {
        ...deviceInfo,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      },
      createdAt: Timestamp.now(),
      lastUsed: Timestamp.now(),
      isActive: true
    };

    const docRef = await adminDb
      .collection('fcm_tokens')
      .add(tokenRecord);

    return NextResponse.json({
      success: true,
      message: 'FCM token saved',
      tokenId: docRef.id
    });

  } catch (error) {
    console.error('Error saving FCM token:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save FCM token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || session.user.id;

    // Ensure user can only access their own tokens
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const tokensQuery = await adminDb
      .collection('fcm_tokens')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .orderBy('lastUsed', 'desc')
      .get();

    const tokens = tokensQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null,
      lastUsed: doc.data().lastUsed?.toDate?.() || null
    }));

    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length
    });

  } catch (error) {
    console.error('Error getting FCM tokens:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get FCM tokens',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const tokenId = searchParams.get('tokenId');
    const token = searchParams.get('token');

    if (!tokenId && !token) {
      return NextResponse.json(
        { error: 'Token ID or token value required' },
        { status: 400 }
      );
    }

    let query;
    if (tokenId) {
      // Delete by document ID
      const tokenDoc = await adminDb
        .collection('fcm_tokens')
        .doc(tokenId)
        .get();

      if (!tokenDoc.exists) {
        return NextResponse.json(
          { error: 'Token not found' },
          { status: 404 }
        );
      }

      const tokenData = tokenDoc.data();
      if (tokenData?.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      await adminDb
        .collection('fcm_tokens')
        .doc(tokenId)
        .update({ isActive: false });

    } else {
      // Delete by token value
      const tokenQuery = await adminDb
        .collection('fcm_tokens')
        .where('token', '==', token)
        .where('userId', '==', session.user.id)
        .get();

      if (tokenQuery.empty) {
        return NextResponse.json(
          { error: 'Token not found' },
          { status: 404 }
        );
      }

      // Deactivate all matching tokens
      const batch = adminDb.batch();
      tokenQuery.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      message: 'FCM token deactivated'
    });

  } catch (error) {
    console.error('Error deleting FCM token:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete FCM token',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}