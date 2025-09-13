import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { searchItems, getUserItems, createItem } from '@/src/lib/firebase-storage';
import { adminDb } from '@/src/lib/firebase-admin';

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
    const searchTerm = url.searchParams.get('search') || '';
    const ownerIdParam = url.searchParams.get('ownerId');
    const minPrice = url.searchParams.get('minPrice');
    const maxPrice = url.searchParams.get('maxPrice');
    
    // Get user to determine ownerId for "me" requests
    let ownerId = null;
    if (ownerIdParam === 'me') {
      const usersSnapshot = await adminDb.collection('users')
        .where('email', '==', session.user.email)
        .limit(1)
        .get();
      
      if (!usersSnapshot.empty) {
        ownerId = usersSnapshot.docs[0].id;
      }
    } else if (ownerIdParam) {
      ownerId = ownerIdParam;
    }
    
    // If requesting user's own items
    if (ownerId) {
      const items = await getUserItems(ownerId);
      return NextResponse.json({ items });
    }
    
    // Build filters for search
    const filters: any = {};
    
    if (category) {
      filters.category = category;
    }
    
    if (location) {
      filters.location = location;
    }
    
    if (minPrice && maxPrice) {
      filters.priceRange = {
        min: parseFloat(minPrice),
        max: parseFloat(maxPrice)
      };
    }
    
    // Search items
    const items = await searchItems(searchTerm, filters);
    
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
    
    // Get user from Firebase
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', session.user.email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    // Check if user has a business profile
    const businessProfileSnapshot = await adminDb.collection('businessProfiles')
      .where('userId', '==', userDoc.id)
      .limit(1)
      .get();
    
    if (businessProfileSnapshot.empty) {
      return NextResponse.json(
        { error: 'You need a business profile to list items' },
        { status: 403 }
      );
    }
    
    // Parse form data for file uploads
    const formData = await req.formData();
    
    // Extract item data
    const itemData = {
      title: formData.get('title') as string || formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      subcategory: formData.get('subcategory') as string,
      price: parseFloat(formData.get('price') as string || formData.get('dailyPrice') as string),
      location: formData.get('location') as string || userData.location || '',
      condition: (formData.get('condition') as 'new' | 'used' | 'refurbished') || 'used',
      ownerId: userDoc.id,
      ownerName: userData.name || session.user.name || '',
      ownerEmail: userData.email || session.user.email || '',
      status: 'available' as const,
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()) : [],
      specifications: formData.get('specifications') ? JSON.parse(formData.get('specifications') as string) : {},
    };
    
    // Extract images
    const images: File[] = [];
    for (const [key, value] of formData.entries()) {
      if ((key.startsWith('image_') || key === 'images') && value instanceof File && value.size > 0) {
        images.push(value);
      }
    }
    
    // Validate required fields
    if (!itemData.title || !itemData.description || !itemData.category || !itemData.price) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, and price are required' },
        { status: 400 }
      );
    }
    
    // Create item with images
    const itemId = await createItem(itemData, images);
    
    return NextResponse.json({ 
      id: itemId, 
      message: 'Item created successfully',
      imagesUploaded: images.length
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
