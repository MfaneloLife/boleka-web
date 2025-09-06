import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the user's email
    const userEmail = session.user.email;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { businessProfile: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user has a business profile
    if (!user.businessProfile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }
    
    // Return the business profile
    return NextResponse.json(user.businessProfile, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch business profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
