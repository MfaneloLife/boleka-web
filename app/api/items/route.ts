import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const location = url.searchParams.get('location');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    const searchTerm = url.searchParams.get('search');
    const minRating = url.searchParams.get('minRating');
    
  // Build filter conditions
  const where: Prisma.ItemWhereInput = {
      availability: true,
    };
    
    if (category) {
      where.category = category;
    }
    
    if (location) {
      where.location = location;
    }
    
    if (minPrice) {
      where.price = {
        ...where.price,
        gte: parseFloat(minPrice),
      };
    }
    
    if (maxPrice) {
      where.price = {
        ...where.price,
        lte: parseFloat(maxPrice),
      };
    }
    
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    // Fetch items with filters
    const items = await prisma.item.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Filter by min rating if specified
    let filteredItems = items;
    if (minRating) {
      const minRatingValue = parseFloat(minRating);
      filteredItems = items.filter(item => {
        if (item.reviews.length === 0) return false;
        
        const avgRating = item.reviews.reduce((sum, review) => sum + review.rating, 0) / item.reviews.length;
        return avgRating >= minRatingValue;
      });
    }
    
    return NextResponse.json(filteredItems);
  } catch (error: unknown) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Verify user has a business profile
    if (!user.hasBusinessProfile) {
      return NextResponse.json(
        { error: 'You need a business profile to list items' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { title, description, price, imageUrls, location, category } = body;
    
    // Validate required fields
    if (!title || !description || !price || !location || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // For SQLite compatibility, convert imageUrls array to JSON string
    const imageUrlsString = JSON.stringify(imageUrls || []);
    
    // Create item
    const item = await prisma.item.create({
      data: {
        title,
        description,
        price: parseFloat(price.toString()),
        imageUrls: imageUrlsString,
        location,
        category,
        ownerId: user.id,
      },
    });
    
    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create item' },
      { status: 500 }
    );
  }
}
