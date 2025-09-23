import { NextRequest, NextResponse } from 'next/server';
import { searchItems, getUserItems, createItem } from '@/src/lib/firebase-storage';
import { adminDb, adminAuth } from '@/src/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
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
      // Require Authorization header for ownerId=me
      const authHeader = req.headers.get('authorization') || '';
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring('Bearer '.length)
        : undefined;
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const decoded = await adminAuth.verifyIdToken(token);
      // Map Firebase Auth UID/email to the Firestore users doc id, which is used as items.ownerId
      let userDocSnap = await adminDb.collection('users').doc(decoded.uid).get();
      if (!userDocSnap.exists) {
        const email = decoded.email;
        if (!email) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const usersSnapshot = await adminDb.collection('users')
          .where('email', '==', email)
          .limit(1)
          .get();
        if (usersSnapshot.empty) {
          return NextResponse.json({ items: [] }, { status: 200 });
        }
        userDocSnap = usersSnapshot.docs[0];
      }
      ownerId = userDocSnap.id;
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
    // Verify Firebase ID token
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const email = decoded.email;
    const uid = decoded.uid;
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Get user from Firebase (prefer uid, fallback to email query)
    let userDocSnap = await adminDb.collection('users').doc(uid).get();
    if (!userDocSnap.exists) {
      const usersSnapshot = await adminDb.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      if (usersSnapshot.empty) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      userDocSnap = usersSnapshot.docs[0];
    }
    const userData = userDocSnap.data() as any;
    
    // Check if user has a business profile
    const businessProfileSnapshot = await adminDb.collection('businessProfiles')
      .where('userId', '==', userDocSnap.id)
      .limit(1)
      .get();
    
    if (businessProfileSnapshot.empty) {
      return NextResponse.json(
        { error: 'You need a business profile to list items' },
        { status: 403 }
      );
    }
    
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      // Accept JSON body with pre-uploaded image URLs
      const body = await req.json();
      const title = body.title || body.name;
      const price = body.price ?? body.dailyPrice;
      if (!title || !body.description || !body.category || price === undefined) {
        return NextResponse.json(
          { error: 'Missing required fields: title, description, category, and price are required' },
          { status: 400 }
        );
      }

      const doc = await adminDb.collection('items').add({
        title,
        description: body.description,
        category: body.category,
        subcategory: body.subcategory || '',
        price: parseFloat(String(price)),
        location: body.location || userData?.location || '',
        condition: (body.condition as 'new' | 'used' | 'refurbished') || 'used',
        ownerId: userDocSnap.id,
        ownerName: userData?.name || decoded.name || '',
        ownerEmail: userData?.email || email || '',
        status: 'available' as const,
        tags: Array.isArray(body.tags) ? body.tags : [],
        specifications: body.specifications || {},
        images: Array.isArray(body.images) ? body.images : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({ id: doc.id, message: 'Item created successfully', imagesUploaded: (Array.isArray(body.images) ? body.images.length : 0) }, { status: 201 });
    } else {
      // Parse form data for file uploads
      const formData = await req.formData();
      
      // Extract item data
      const itemData = {
        title: (formData.get('title') as string) || (formData.get('name') as string),
        description: formData.get('description') as string,
        category: formData.get('category') as string,
        subcategory: formData.get('subcategory') as string,
        price: parseFloat((formData.get('price') as string) || (formData.get('dailyPrice') as string)),
        location: (formData.get('location') as string) || (userData?.location || ''),
        condition: (formData.get('condition') as 'new' | 'used' | 'refurbished') || 'used',
        ownerId: userDocSnap.id,
        ownerName: userData?.name || decoded.name || '',
        ownerEmail: userData?.email || email || '',
        status: 'available' as const,
        tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()) : [],
        specifications: formData.get('specifications') ? JSON.parse(formData.get('specifications') as string) : {},
        images: [], // Will be populated with uploaded URLs
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
    }
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
