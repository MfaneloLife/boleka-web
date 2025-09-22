import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { RentalAgreementService } from '@/src/lib/rental-agreement-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { agreementId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agreement = await RentalAgreementService.getAgreement(params.agreementId);
    
    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Check if user is authorized to view this agreement
    if (agreement.owner.id !== session.user.id && agreement.renter.id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(agreement);
  } catch (error) {
    console.error('Error fetching rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental agreement' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { agreementId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Get existing agreement to check permissions
    const agreement = await RentalAgreementService.getAgreement(params.agreementId);
    
    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Check if user can modify this agreement
    if (!RentalAgreementService.canModifyAgreement(agreement, session.user.id)) {
      return NextResponse.json({ error: 'Cannot modify this agreement' }, { status: 403 });
    }

    await RentalAgreementService.updateAgreement(params.agreementId, body);

    return NextResponse.json({ 
      success: true,
      message: 'Agreement updated successfully' 
    });
  } catch (error) {
    console.error('Error updating rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to update rental agreement' },
      { status: 500 }
    );
  }
}