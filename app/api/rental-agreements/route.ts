import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { RentalAgreementService } from '@/src/lib/rental-agreement-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') || session.user.id;
    const role = searchParams.get('role') as 'owner' | 'renter' | 'both' || 'both';

    const agreements = await RentalAgreementService.getUserAgreements(userId, role);
    return NextResponse.json(agreements);
  } catch (error) {
    console.error('Error fetching rental agreements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental agreements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const agreementId = await RentalAgreementService.createAgreementFromOrder(orderId);

    return NextResponse.json({ 
      success: true, 
      agreementId,
      message: 'Rental agreement created successfully' 
    });
  } catch (error) {
    console.error('Error creating rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to create rental agreement' },
      { status: 500 }
    );
  }
}