import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { RewardsService } from '@/src/lib/rewards-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    switch (type) {
      case 'history': {
        const limit = searchParams.get('limit');
        const history = await RewardsService.getPointsHistory(
          session.user.id, 
          limit ? parseInt(limit) : undefined
        );
        
        return NextResponse.json({
          history,
          count: history.length
        });
      }

      case 'discounts': {
        const includeUsed = searchParams.get('includeUsed') === 'true';
        const discounts = await RewardsService.getUserDiscounts(
          session.user.id, 
          includeUsed
        );
        
        return NextResponse.json({
          discounts,
          count: discounts.length
        });
      }

      case 'leaderboard': {
        // Public leaderboard
        const limit = searchParams.get('limit');
        const leaderboard = await RewardsService.getLeaderboard(
          limit ? parseInt(limit) : undefined
        );
        
        // Remove sensitive information
        const publicLeaderboard = leaderboard.map((user, index) => ({
          rank: index + 1,
          tier: user.tier,
          totalPoints: user.totalPoints,
          reliabilityScore: user.reliabilityScore,
          onTimeReturns: user.onTimeReturns,
          // Don't expose user ID or other sensitive data
          anonymizedId: `User${user.userId.slice(-4)}`
        }));
        
        return NextResponse.json({
          leaderboard: publicLeaderboard
        });
      }

      default: {
        // Get user rewards summary
        const rewards = await RewardsService.getUserRewards(session.user.id);
        
        if (!rewards) {
          // Initialize if not exists
          const newRewards = await RewardsService.initializeUserRewards(session.user.id);
          return NextResponse.json({ rewards: newRewards });
        }
        
        return NextResponse.json({ rewards });
      }
    }

  } catch (error) {
    console.error('Error fetching rewards data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'award_points': {
        const { points, reason, metadata } = data;
        
        // Validate input
        if (!points || points <= 0) {
          return NextResponse.json(
            { error: 'Invalid points amount' },
            { status: 400 }
          );
        }
        
        if (!reason) {
          return NextResponse.json(
            { error: 'Reason is required' },
            { status: 400 }
          );
        }

        // For manual point awards, only admins should be able to do this
        if (reason === 'manual_award' || reason === 'bonus_points') {
          if (!session.user.role || !['admin', 'moderator'].includes(session.user.role)) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        }

        const transaction = await RewardsService.awardPoints(
          data.userId || session.user.id,
          points,
          reason,
          metadata
        );

        return NextResponse.json({
          success: true,
          transaction,
          message: 'Points awarded successfully'
        });
      }

      case 'record_on_time_return': {
        const { orderId } = data;
        
        if (!orderId) {
          return NextResponse.json(
            { error: 'Order ID is required' },
            { status: 400 }
          );
        }

        // Award points for on-time return (5 points)
        const transaction = await RewardsService.awardPoints(
          session.user.id,
          5,
          'on_time_return',
          { orderId }
        );

        return NextResponse.json({
          success: true,
          transaction,
          pointsAwarded: 5,
          message: 'On-time return recorded and points awarded'
        });
      }

      case 'record_late_return': {
        const { orderId } = data;
        
        if (!orderId) {
          return NextResponse.json(
            { error: 'Order ID is required' },
            { status: 400 }
          );
        }

        await RewardsService.recordLateReturn(session.user.id, orderId);

        return NextResponse.json({
          success: true,
          message: 'Late return recorded'
        });
      }

      case 'redeem_discount': {
        const { pointsCost, discountPercentage, validDays } = data;
        
        // Validate input
        if (!pointsCost || pointsCost < 15) {
          return NextResponse.json(
            { error: 'Minimum 15 points required for discount' },
            { status: 400 }
          );
        }

        if (!discountPercentage || discountPercentage < 1 || discountPercentage > 50) {
          return NextResponse.json(
            { error: 'Invalid discount percentage (1-50%)' },
            { status: 400 }
          );
        }

        // Calculate valid until date
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + (validDays || 30));

        const discount = await RewardsService.createDiscount(
          session.user.id,
          pointsCost,
          discountPercentage,
          validUntil
        );

        return NextResponse.json({
          success: true,
          discount,
          message: 'Discount created successfully'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing rewards request:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Insufficient points') {
        return NextResponse.json(
          { error: 'You do not have enough points for this action' },
          { status: 400 }
        );
      }
      
      if (error.message === 'Not eligible for discount') {
        return NextResponse.json(
          { error: 'You are not eligible for this discount' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process rewards request' },
      { status: 500 }
    );
  }
}