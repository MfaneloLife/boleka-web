import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/src/lib/firebase-admin';
import { matchingAlgorithm } from '@/src/lib/matching-algorithm';

export async function GET(request: NextRequest) {
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
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'business' or 'client'
    const targetId = searchParams.get('targetId'); // ID to find matches for

    if (!type || !targetId) {
      return NextResponse.json(
        { error: 'Type and targetId are required parameters' },
        { status: 400 }
      );
    }

    let matches;
    
    if (type === 'business') {
      // Find clients for a business
      matches = await matchingAlgorithm.findClientMatches(targetId);
    } else if (type === 'client') {
      // Find businesses for a client
      matches = await matchingAlgorithm.findBusinessMatches(targetId);
    } else {
      return NextResponse.json(
        { error: 'Type must be either "business" or "client"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      matches,
      count: matches.length
    });

  } catch (error) {
    console.error('Error in matching API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}