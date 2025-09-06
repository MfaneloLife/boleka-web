import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { 
  createReview, 
  getItemReviews, 
  getUserGivenReviews, 
  getUserReceivedReviews 
} from '@/lib/reviews';
import { prisma } from '@/lib/prisma';

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

    // Parse request body
    const body = await req.json();
    const { rating, comment, itemId, requestId } = body;

    if (!rating || !itemId) {
      return NextResponse.json(
        { error: 'Rating and itemId are required' },
        { status: 400 }
      );
    }

    // Get the item to check ownership
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { userId: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // User can't review their own items
    if (item.userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot review your own items' },
        { status: 400 }
      );
    }

    // If requestId is provided, verify that this user made the request
    if (requestId) {
      const request = await prisma.request.findUnique({
        where: { id: requestId },
        select: { userId: true },
      });

      if (!request || request.userId !== user.id) {
        return NextResponse.json(
          { error: 'Invalid request' },
          { status: 400 }
        );
      }
    }

    // Create the review
    const review = await createReview({
      rating,
      comment,
      itemId,
      reviewerId: user.id,
      ownerId: item.userId,
      requestId,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while creating the review' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
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

    // Get query parameters
    const url = new URL(req.url);
    const itemId = url.searchParams.get('itemId');
    const type = url.searchParams.get('type'); // 'given', 'received', or undefined
    
    // Get reviews based on query parameters
    if (itemId) {
      // Get reviews for a specific item
      const reviews = await getItemReviews(itemId);
      return NextResponse.json(reviews);
    } else if (type === 'given') {
      // Get reviews given by the user
      const reviews = await getUserGivenReviews(user.id);
      return NextResponse.json(reviews);
    } else if (type === 'received') {
      // Get reviews received by the user
      const reviews = await getUserReceivedReviews(user.id);
      return NextResponse.json(reviews);
    } else {
      // Default: get reviews given by the user
      const reviews = await getUserGivenReviews(user.id);
      return NextResponse.json(reviews);
    }
  } catch (error: unknown) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred while fetching reviews' },
      { status: 500 }
    );
  }
}
