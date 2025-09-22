import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MLVisionService } from '@/src/lib/ml-vision-service';

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
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Ensure user can only search their own text extractions
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (!query.trim()) {
      return NextResponse.json(
        { error: 'Search query required' },
        { status: 400 }
      );
    }

    const results = await MLVisionService.searchExtractedText(query, userId, limit);

    return NextResponse.json({
      success: true,
      results,
      query,
      total: results.length
    });

  } catch (error) {
    console.error('Error searching text:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search text',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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
    const { userId, extractedText, language, confidence, boundingBoxes } = body;

    // Validate required fields
    if (!extractedText) {
      return NextResponse.json(
        { error: 'Extracted text is required' },
        { status: 400 }
      );
    }

    // Ensure user can only save to their own extractions
    const targetUserId = userId || session.user.id;
    if (targetUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create text extraction record
    const textExtraction = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      extractedText,
      language: language || 'unknown',
      confidence: confidence || 0.9,
      boundingBoxes: boundingBoxes || [],
      extractedAt: new Date(),
      userId: targetUserId
    };

    // Save to database
    const { adminDb } = await import('@/src/lib/firebase-admin');
    const docRef = await adminDb
      .collection('text_extractions')
      .add(textExtraction);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Text extraction saved'
    });

  } catch (error) {
    console.error('Error saving text extraction:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save text extraction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}