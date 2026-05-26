import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      country,
      region,
      city,
      suburb,
      contactNumber,
      returnWindowHours,
      lateFeePerDay,
    } = body;

    if (!businessName || !contactNumber) {
      return NextResponse.json(
        { error: 'Business name and contact number are required' },
        { status: 400 }
      );
    }

    // Update user profile with business info and location
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: businessName,
        phone: contactNumber,
        country: country || 'ZA',
        region: region || '',
        city: city || '',
        profileCompleted: true,
        hasBusinessProfile: true,
        role: 'owner',
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Business profile created successfully',
    });
  } catch (error) {
    console.error('BUSINESS_PROFILE_ERROR', error);
    return NextResponse.json(
      { error: 'Failed to create business profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      country,
      region,
      city,
      suburb,
      contactNumber,
    } = body;

    const updateData: any = {};
    if (businessName !== undefined) updateData.name = businessName;
    if (contactNumber !== undefined) updateData.phone = contactNumber;
    if (country !== undefined) updateData.country = country;
    if (region !== undefined) updateData.region = region;
    if (city !== undefined) updateData.city = city;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Business profile updated successfully',
    });
  } catch (error) {
    console.error('BUSINESS_PROFILE_UPDATE_ERROR', error);
    return NextResponse.json(
      { error: 'Failed to update business profile' },
      { status: 500 }
    );
  }
}
