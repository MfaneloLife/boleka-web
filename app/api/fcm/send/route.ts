import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getMessaging } from 'firebase-admin/messaging';
import { adminDb } from '@/src/lib/firebase-admin';

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
    const { userId, notification, tokens } = body;

    if (!userId || !notification) {
      return NextResponse.json(
        { error: 'User ID and notification are required' },
        { status: 400 }
      );
    }

    // Get FCM tokens for the user if not provided
    let targetTokens = tokens;
    if (!targetTokens) {
      const tokensQuery = await adminDb
        .collection('fcm_tokens')
        .where('userId', '==', userId)
        .where('isActive', '==', true)
        .get();

      targetTokens = tokensQuery.docs.map(doc => doc.data().token);
    }

    if (!targetTokens || targetTokens.length === 0) {
      return NextResponse.json(
        { error: 'No active FCM tokens found for user' },
        { status: 404 }
      );
    }

    // Prepare FCM message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image
      },
      data: {
        ...notification.data,
        timestamp: Date.now().toString(),
        senderId: session.user.id
      },
      tokens: targetTokens
    };

    // Send notification using Firebase Admin SDK
    const messaging = getMessaging();
    const response = await messaging.sendEachForMulticast(message);

    // Log results
    console.log('FCM Send Results:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses.map(r => r.success ? 'success' : r.error?.code)
    });

    // Handle failed tokens (remove invalid ones)
    const failedTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errorCode = resp.error.code;
        if (['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(errorCode)) {
          failedTokens.push(targetTokens[idx]);
        }
      }
    });

    // Remove invalid tokens from database
    if (failedTokens.length > 0) {
      const batch = adminDb.batch();
      for (const token of failedTokens) {
        const tokenQuery = await adminDb
          .collection('fcm_tokens')
          .where('token', '==', token)
          .get();
        
        tokenQuery.docs.forEach(doc => {
          batch.update(doc.ref, { isActive: false });
        });
      }
      await batch.commit();
      console.log(`Removed ${failedTokens.length} invalid FCM tokens`);
    }

    // Store notification in database for history
    await adminDb
      .collection('notifications')
      .add({
        userId,
        senderId: session.user.id,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sentAt: new Date(),
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: targetTokens.length,
        status: response.successCount > 0 ? 'sent' : 'failed'
      });

    return NextResponse.json({
      success: true,
      results: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        totalTokens: targetTokens.length,
        invalidTokensRemoved: failedTokens.length
      },
      message: `Notification sent to ${response.successCount} device(s)`
    });

  } catch (error) {
    console.error('Error sending FCM notification:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send notification',
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
    const limit = parseInt(searchParams.get('limit') || '20');

    // Ensure user can only access their own notifications
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const notificationsQuery = await adminDb
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('sentAt', 'desc')
      .limit(limit)
      .get();

    const notifications = notificationsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt?.toDate?.() || null
    }));

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length
    });

  } catch (error) {
    console.error('Error getting notifications:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}