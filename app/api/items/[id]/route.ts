import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getItemById, updateItem, deleteItem } from '@/src/lib/firebase-storage';
import { adminDb } from '@/src/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    const item = await getItemById(id);
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get user from Firebase
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', session.user.email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = usersSnapshot.docs[0];

    // Check if user owns the item
    const itemDoc = await adminDb.collection('items').doc(id).get();
    if (!itemDoc.exists) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const itemData = itemDoc.data();
    if (itemData?.ownerId !== userDoc.id) {
      return NextResponse.json({ error: 'Not authorized to update this item' }, { status: 403 });
    }

    const body = await req.json();

    // Update item using new Firebase storage system
    await updateItem(id, body);

    return NextResponse.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get user from Firebase
    const usersSnapshot = await adminDb.collection('users')
      .where('email', '==', session.user.email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = usersSnapshot.docs[0];

    // Check if user owns the item
    const itemDoc = await adminDb.collection('items').doc(id).get();
    if (!itemDoc.exists) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const itemData = itemDoc.data();
    if (itemData?.ownerId !== userDoc.id) {
      return NextResponse.json({ error: 'Not authorized to delete this item' }, { status: 403 });
    }

    // Delete item and its images using new Firebase storage system
    await deleteItem(id);

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
