import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Initialize Vision API client
let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient() {
  if (!visionClient) {
    // Check if we have the service account key
    const serviceAccountKey = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountKey) {
      // Parse the service account key JSON
      const credentials = JSON.parse(serviceAccountKey);
      visionClient = new ImageAnnotatorClient({
        credentials,
        projectId: credentials.project_id,
      });
    } else {
      // Fallback to default credentials (for Cloud Run, etc.)
      visionClient = new ImageAnnotatorClient();
    }
  }
  return visionClient;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image, mode } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!['barcode', 'qr', 'labels'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const client = getVisionClient();

    // Prepare the image for Vision API
    const imageRequest = {
      image: {
        content: image, // base64 encoded image
      },
    };

    let result = {};

    switch (mode) {
      case 'barcode':
      case 'qr':
        // Text detection can handle both barcodes and QR codes
        const [textResult] = await client.textDetection(imageRequest);
        const detections = textResult.textAnnotations || [];
        
        if (detections.length > 0) {
          // The first detection is usually the full text
          const fullText = detections[0].description || '';
          
          if (mode === 'barcode') {
            // For barcodes, we'll return the detected text
            result = {
              barcodes: [{
                text: fullText.trim(),
                format: 'unknown', // Vision API doesn't specify barcode format
                confidence: detections[0].confidence || 1.0
              }]
            };
          } else {
            // For QR codes, return the text content
            result = {
              qrCodes: [fullText.trim()]
            };
          }
        } else {
          result = mode === 'barcode' ? { barcodes: [] } : { qrCodes: [] };
        }
        break;

      case 'labels':
        // Label detection for identifying objects
        const [labelResult] = await client.labelDetection(imageRequest);
        const labels = labelResult.labelAnnotations || [];
        
        result = {
          labels: labels.map(label => ({
            description: label.description,
            score: label.score,
            confidence: label.score
          }))
        };
        break;

      default:
        return NextResponse.json({ error: 'Unsupported mode' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Vision API error:', error);
    
    // Check if it's a configuration error
    if (error instanceof Error && error.message.includes('credentials')) {
      return NextResponse.json({ 
        error: 'Vision API not configured. Please set up Google Cloud credentials.' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to analyze image' 
    }, { status: 500 });
  }
}