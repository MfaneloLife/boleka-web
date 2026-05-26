import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RentalAgreementService } from '@/src/lib/rental-agreement-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ agreementId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agreementId } = await params;
    const body = await request.json();
    const { signature } = body;

    if (!signature || signature.trim().length === 0) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 });
    }

    const agreement = await RentalAgreementService.getAgreement(agreementId);
    
    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Check if the user is either the owner or renter of this agreement
    if (agreement.ownerId !== userId && agreement.renterId !== userId) {
      return NextResponse.json({ error: 'Cannot sign this agreement' }, { status: 403 });
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await RentalAgreementService.signAgreement(
      agreementId,
      userId,
      signature.trim(),
      ipAddress,
      userAgent
    );

    return NextResponse.json({ 
      success: true,
      message: 'Agreement signed successfully' 
    });
  } catch (error) {
    console.error('Error signing rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to sign rental agreement' },
      { status: 500 }
    );
  }
}
