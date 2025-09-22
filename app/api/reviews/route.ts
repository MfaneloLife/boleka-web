import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ReviewService } from '@/src/lib/review-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') as 'received' | 'given' | undefined;
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const reviews = await ReviewService.getUserReviews(userId, type, limit);
    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rating, comment, orderId, revieweeId, reviewType } = body;

    // Validate required fields
    if (!rating || !comment || !orderId || !revieweeId || !reviewType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate comment length
    if (comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Comment must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Check if user can leave review for this order
    const reviewEligibility = await ReviewService.canUserReviewOrder(orderId, session.user.id);
    
    if (!reviewEligibility.canReview) {
      return NextResponse.json(
        { error: 'You cannot review this order' },
        { status: 403 }
      );
    }

    // Verify review type matches user's role in the order
    if (reviewEligibility.reviewType !== reviewType) {
      return NextResponse.json(
        { error: 'Invalid review type for your role' },
        { status: 400 }
      );
    }

    const reviewData = {
      rating,
      comment: comment.trim(),
      orderId,
      revieweeId,
      reviewType
    };

    const reviewId = await ReviewService.createReview(reviewData, session.user.id);

    return NextResponse.json({ 
      success: true, 
      reviewId,
      message: 'Review submitted successfully' 
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
