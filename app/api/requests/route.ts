import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { clientProfile: true }
    });
    
    if (!user || !user.clientProfile) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }
    
    const { itemId, message } = await request.json();
    
    if (!itemId || !message) {
      return NextResponse.json({ error: 'Item ID and message are required' }, { status: 400 });
    }
    
    // Check if the item exists
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { owner: true }
    });
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    // Create the request
    const newRequest = await prisma.request.create({
      data: {
        item: { connect: { id: itemId } },
        requester: { connect: { id: user.id } },
        owner: { connect: { id: item.ownerId } },
        status: 'pending',
      },
    });
    
    // Create the first message
    await prisma.message.create({
      data: {
        content: message,
        request: { connect: { id: newRequest.id } },
        sender: { connect: { id: user.id } },
      }
    });
    
    return NextResponse.json({ id: newRequest.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
