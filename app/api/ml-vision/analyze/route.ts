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

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const userId = formData.get('userId') as string;
    const enableBarcodeScanning = formData.get('enableBarcodeScanning') === 'true';
    const enableTextExtraction = formData.get('enableTextExtraction') === 'true';
    const enableImageLabeling = formData.get('enableImageLabeling') === 'true';

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Validate file size (max 10MB)
    if (imageBuffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image file too large (max 10MB)' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Supported: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Analyze image with ML Vision
    const analysisResult = await MLVisionService.analyzeImage(
      imageBuffer,
      {
        detectBarcodes: enableBarcodeScanning,
        extractText: enableTextExtraction,
        detectLabels: enableImageLabeling,
        detectFaces: false, // Keep disabled for privacy
        detectObjects: false
      },
      {
        userId: userId || session.user.id,
        filename: imageFile.name,
        imageUrl: '' // Could be set if image is stored
      }
    );

    return NextResponse.json({
      success: true,
      result: analysisResult,
      barcodes: analysisResult.barcodes,
      textExtraction: analysisResult.textExtraction,
      labels: analysisResult.labels,
      processingTime: analysisResult.processingTime,
      imageId: analysisResult.imageId
    });

  } catch (error) {
    console.error('Error in ML Vision analysis:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze image',
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
    const type = searchParams.get('type'); // 'barcodes', 'text', 'labels'

    // Ensure user can only access their own data (unless admin)
    if (userId !== session.user.id) {
      // TODO: Add admin role check
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    let results: any[] = [];

    switch (type) {
      case 'barcodes':
        results = await MLVisionService.getUserBarcodes(userId, limit);
        break;
      case 'text':
        results = await MLVisionService.getUserTextExtractions(userId, limit);
        break;
      default:
        // Return recent analysis results
        const barcodes = await MLVisionService.getUserBarcodes(userId, 10);
        const textExtractions = await MLVisionService.getUserTextExtractions(userId, 10);
        
        return NextResponse.json({
          success: true,
          barcodes,
          textExtractions
        });
    }

    return NextResponse.json({
      success: true,
      results,
      type,
      count: results.length
    });

  } catch (error) {
    console.error('Error getting ML Vision results:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get analysis results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}