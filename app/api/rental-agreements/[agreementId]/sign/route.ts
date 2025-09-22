import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { RentalAgreementService } from '@/src/lib/rental-agreement-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { agreementId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { signature } = body;

    if (!signature || signature.trim().length === 0) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 });
    }

    // Get agreement to check permissions
    const agreement = await RentalAgreementService.getAgreement(params.agreementId);
    
    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Check if user can sign this agreement
    if (!RentalAgreementService.canSignAgreement(agreement, session.user.id)) {
      return NextResponse.json({ error: 'Cannot sign this agreement' }, { status: 403 });
    }

    // Get client IP and user agent for signature verification
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await RentalAgreementService.signAgreement(
      params.agreementId,
      session.user.id,
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