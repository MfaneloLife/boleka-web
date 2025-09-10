import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { FirebaseDbService } from '@/src/lib/firebase-db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const searchTerm = url.searchParams.get('search');
    const ownerIdParam = url.searchParams.get('ownerId');
    
    // Get user to determine ownerId for "me" requests
    let ownerId = null;
    if (ownerIdParam === 'me') {
      const userResult = await FirebaseDbService.getUserByEmail(session.user.email);
      if (userResult.success && userResult.user) {
        ownerId = userResult.user.id;
      }
    } else if (ownerIdParam) {
      ownerId = ownerIdParam;
    }
    
    // Build filter conditions for Firebase
    const filters: any = {};
    
    if (category) {
      filters.category = category;
    }
    
    if (ownerId) {
      filters.ownerId = ownerId;
    }
    
    // Set default to show only available items unless it's the owner viewing their own items
    if (!ownerId) {
      filters.isAvailable = true;
    }
    
    // Get items from Firebase
    const result = await FirebaseDbService.getItems(filters);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
    
    let items = result.items || [];
    
    // Client-side filtering for search term (Firestore doesn't support full-text search easily)
    if (searchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user
    const userResult = await FirebaseDbService.getUserByEmail(session.user.email);
    
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Verify user has a business profile
    if (!userResult.user.hasBusinessProfile) {
      return NextResponse.json(
        { error: 'You need a business profile to list items' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { name, description, dailyPrice, images, category, condition } = body;
    
    // Validate required fields
    if (!name || !description || !dailyPrice || !category || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create item
    const itemResult = await FirebaseDbService.createItem({
      name,
      description,
      category,
      condition,
      dailyPrice: parseFloat(dailyPrice.toString()),
      isAvailable: true,
      images: images || [],
      ownerId: userResult.user.id,
    });
    
    if (!itemResult.success) {
      return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
    
    return NextResponse.json({ id: itemResult.id, message: 'Item created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
