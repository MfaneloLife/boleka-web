import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { FirebaseDbService } from '@/src/lib/firebase-db';

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
    
    const result = await FirebaseDbService.getItemById(id);
    
    if (!result.success || !result.item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return NextResponse.json(result.item);
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
    const body = await req.json();

    // Get user
    const userResult = await FirebaseDbService.getUserByEmail(session.user.email);
    
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the item to verify ownership
    const itemResult = await FirebaseDbService.getItemById(id);
    
    if (!itemResult.success || !itemResult.item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Verify ownership
    if (itemResult.item.ownerId !== userResult.user.id) {
      return NextResponse.json({ error: 'Not authorized to update this item' }, { status: 403 });
    }

    // Update item
    const updateResult = await FirebaseDbService.updateItem(id, body);
    
    if (!updateResult.success) {
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }

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

    // Get user
    const userResult = await FirebaseDbService.getUserByEmail(session.user.email);
    
    if (!userResult.success || !userResult.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the item to verify ownership
    const itemResult = await FirebaseDbService.getItemById(id);
    
    if (!itemResult.success || !itemResult.item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Verify ownership
    if (itemResult.item.ownerId !== userResult.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this item' }, { status: 403 });
    }

    // Delete item
    const deleteResult = await FirebaseDbService.deleteItem(id);
    
    if (!deleteResult.success) {
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
