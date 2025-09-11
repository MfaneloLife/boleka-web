import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/src/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get featured items (recent, available items with good ratings)
    const itemsSnapshot = await adminDb.collection('items')
      .where('status', '==', 'available')
      .orderBy('createdAt', 'desc')
      .limit(12)
      .get();

    const items = itemsSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        price: data.pricePerDay || data.price || 0,
        location: data.location || data.province || 'Location not specified',
        imageUrl: data.imageUrls?.[0] || data.imageUrl,
        category: data.category,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching featured items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured items' },
      { status: 500 }
    );
  }
}
