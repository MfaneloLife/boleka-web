import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { RentalAgreementService } from '@/src/lib/rental-agreement-service';
import { PDFGenerator } from '@/src/lib/pdf-generator';
import { Timestamp } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: { agreementId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const agreementId = params.agreementId;

    // Get the agreement
    const agreement = await RentalAgreementService.getAgreement(agreementId);
    
    if (!agreement) {
      return NextResponse.json(
        { error: 'Agreement not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to download this agreement
    const canAccess = agreement.owner.id === session.user.id || 
                     agreement.renter.id === session.user.id;
    
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Unauthorized to access this agreement' },
        { status: 403 }
      );
    }

    // Parse query parameters for PDF options
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') as 'A4' | 'Letter' || 'A4';
    const orientation = searchParams.get('orientation') as 'portrait' | 'landscape' || 'portrait';
    const includeSignatures = searchParams.get('signatures') !== 'false';
    const watermark = searchParams.get('watermark') || '';
    const download = searchParams.get('download') === 'true';

    // Generate PDF
    const pdfBlob = await PDFGenerator.generateAgreementPDF(agreement, {
      format,
      orientation,
      includeSignatures,
      watermark
    });

    // Convert blob to buffer for response
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set response headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Length', buffer.length.toString());
    
    if (download) {
      headers.set(
        'Content-Disposition', 
        `attachment; filename="rental-agreement-${agreement.agreementNumber}.pdf"`
      );
    } else {
      headers.set(
        'Content-Disposition', 
        `inline; filename="rental-agreement-${agreement.agreementNumber}.pdf"`
      );
    }

    // Add caching headers
    headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    headers.set('ETag', `"${agreement.id}-${agreement.updatedAt.toMillis()}"`);

    return new NextResponse(buffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { agreementId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const agreementId = params.agreementId;
    const body = await request.json();

    // Get the agreement
    const agreement = await RentalAgreementService.getAgreement(agreementId);
    
    if (!agreement) {
      return NextResponse.json(
        { error: 'Agreement not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized
    const canAccess = agreement.owner.id === session.user.id || 
                     agreement.renter.id === session.user.id;
    
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Unauthorized to access this agreement' },
        { status: 403 }
      );
    }

    // Generate and upload PDF to storage
    const downloadURL = await PDFGenerator.generateAndUploadPDF(agreement, body.options);

    // Update agreement with PDF URL
    await RentalAgreementService.updateAgreement(agreementId, {
      pdfUrl: downloadURL,
      pdfGeneratedAt: Timestamp.now()
    });

    return NextResponse.json({
      success: true,
      pdfUrl: downloadURL,
      message: 'PDF generated and uploaded successfully'
    });

  } catch (error) {
    console.error('Error generating and uploading PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate and upload PDF' },
      { status: 500 }
    );
  }
}