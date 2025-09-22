import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { MLVisionService } from '@/src/lib/ml-vision-service';

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
    const { 
      userId, 
      type, 
      data, 
      format, 
      confidence, 
      extractedText, 
      imageLabels,
      scannedAt 
    } = body;

    // Validate required fields
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data' },
        { status: 400 }
      );
    }

    // Ensure user can only save to their own history
    const targetUserId = userId || session.user.id;
    if (targetUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Create barcode record
    const barcodeResult = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      format: format || 'UNKNOWN',
      confidence: confidence || 0.9,
      extractedAt: new Date(scannedAt || Date.now()),
      userId: targetUserId,
      metadata: {
        extractedText,
        imageLabels,
        source: 'manual_scan'
      }
    };

    // Save to database using ML Vision service
    // For now, we'll save directly to Firestore
    const { adminDb } = await import('@/src/lib/firebase-admin');
    const docRef = await adminDb
      .collection('scanned_barcodes')
      .add({
        ...barcodeResult,
        extractedAt: new Date()
      });

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Barcode saved to history'
    });

  } catch (error) {
    console.error('Error saving barcode history:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save barcode history',
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    // Ensure user can only access their own history
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const barcodes = await MLVisionService.getUserBarcodes(userId, limit);

    // Apply search filter if provided
    let filteredBarcodes = barcodes;
    if (search) {
      filteredBarcodes = barcodes.filter(barcode => 
        barcode.data.toLowerCase().includes(search.toLowerCase()) ||
        barcode.type.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      barcodes: filteredBarcodes,
      total: filteredBarcodes.length,
      query: { userId, limit, search }
    });

  } catch (error) {
    console.error('Error getting barcode history:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get barcode history',
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
    const barcodeId = searchParams.get('id');

    if (!barcodeId) {
      return NextResponse.json(
        { error: 'Barcode ID required' },
        { status: 400 }
      );
    }

    // Get barcode to verify ownership
    const { adminDb } = await import('@/src/lib/firebase-admin');
    const barcodeDoc = await adminDb
      .collection('scanned_barcodes')
      .doc(barcodeId)
      .get();

    if (!barcodeDoc.exists) {
      return NextResponse.json(
        { error: 'Barcode not found' },
        { status: 404 }
      );
    }

    const barcodeData = barcodeDoc.data();
    if (barcodeData?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete barcode
    await adminDb
      .collection('scanned_barcodes')
      .doc(barcodeId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'Barcode deleted from history'
    });

  } catch (error) {
    console.error('Error deleting barcode:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete barcode',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}