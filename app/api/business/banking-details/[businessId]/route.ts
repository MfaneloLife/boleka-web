import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { businessId } = params;
    
    // Get the business profile
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { id: businessId },
      include: { user: true }
    });
    
    // Check if business profile exists
    if (!businessProfile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }
    
    // Check if the user owns this business profile
    if (businessProfile.user.email !== session.user.email) {
      return NextResponse.json({ error: 'You do not have permission to update this business profile' }, { status: 403 });
    }
    
    // Get banking details from request body
    const body = await request.json();
    const {
      bankName,
      accountNumber,
      accountType,
      branchCode,
      accountHolderName
    } = body;
    
    // Validate banking details
    if (!bankName || !accountNumber || !accountType || !branchCode || !accountHolderName) {
      return NextResponse.json({ error: 'All banking details are required' }, { status: 400 });
    }
    
    // Update business profile with banking details
    const updatedBusinessProfile = await prisma.businessProfile.update({
      where: { id: businessId },
      data: {
        bankName,
        accountNumber,
        accountType,
        branchCode,
        accountHolderName
      }
    });
    
    return NextResponse.json({
      message: 'Banking details updated successfully',
      businessProfile: {
        id: updatedBusinessProfile.id,
        bankName: updatedBusinessProfile.bankName,
        accountType: updatedBusinessProfile.accountType
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error updating banking details:', error);
    return NextResponse.json({ 
      error: 'Failed to update banking details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
