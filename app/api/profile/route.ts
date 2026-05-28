import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      phone: user.phone,
      bio: (user as any).bio || '',
      dateOfBirth: (user as any).dateOfBirth || null,
      country: (user as any).country || 'ZA',
      region: (user as any).region || '',
      city: (user as any).city || '',
      suburb: (user as any).suburb || '',
      address: (user as any).address || '',
      businessName: (user as any).businessName || '',
      businessDescription: (user as any).businessDescription || '',
      returnWindowHours: (user as any).returnWindowHours || 48,
      lateFeePerDay: (user as any).lateFeePerDay || 50,
      language: (user as any).language || 'en',
      profileCompleted: user.profileCompleted,
      hasBusinessProfile: user.hasBusinessProfile,
    });
  } catch (error) {
    console.error('PROFILE_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name, phone, country, region, city, suburb, address, image,
      bio, dateOfBirth,
      businessName, businessDescription, returnWindowHours, lateFeePerDay,
      language
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (country !== undefined) updateData.country = country;
    if (region !== undefined) updateData.region = region;
    if (city !== undefined) updateData.city = city;
    if (suburb !== undefined) updateData.suburb = suburb;
    if (address !== undefined) updateData.address = address;
    if (image !== undefined) updateData.image = image;
    if (bio !== undefined) updateData.bio = bio;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (businessName !== undefined) updateData.businessName = businessName;
    if (businessDescription !== undefined) updateData.businessDescription = businessDescription;
    if (returnWindowHours !== undefined) updateData.returnWindowHours = returnWindowHours;
    if (lateFeePerDay !== undefined) updateData.lateFeePerDay = lateFeePerDay;
    if (language !== undefined) updateData.language = language;
    if (name !== undefined || businessName !== undefined) {
      updateData.profileCompleted = true;
    }


    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('PROFILE_UPDATE_ERROR', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
