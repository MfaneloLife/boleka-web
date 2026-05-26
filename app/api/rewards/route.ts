import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { RewardsService } from '@/src/lib/rewards-service';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
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
          userId, 
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
          userId, 
          includeUsed
        );
        
        return NextResponse.json({
          discounts,
          count: discounts.length
        });
      }

      case 'leaderboard': {
        const limit = searchParams.get('limit');
        const leaderboard = await RewardsService.getLeaderboard(
          limit ? parseInt(limit) : undefined
        );
        
        const publicLeaderboard = leaderboard.map((user: any, index: number) => ({
          rank: index + 1,
          tier: user.tier,
          totalPoints: user.totalPoints,
          reliabilityScore: user.reliabilityScore,
          onTimeReturns: user.onTimeReturns,
          anonymizedId: `User${user.userId.slice(-4)}`
        }));
        
        return NextResponse.json({
          leaderboard: publicLeaderboard
        });
      }

      default: {
        const rewards = await RewardsService.getUserRewards(userId);
        
        if (!rewards) {
          const newRewards = await RewardsService.initializeUserRewards(userId);
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
    const { userId } = await auth();
    
    if (!userId) {
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

        if (reason === 'manual_award' || reason === 'bonus_points') {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }

        const transaction = await RewardsService.awardPoints(
          data.userId || userId,
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

        const transaction = await RewardsService.awardPoints(
          userId,
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

        await RewardsService.recordLateReturn(userId, orderId);

        return NextResponse.json({
          success: true,
          message: 'Late return recorded'
        });
      }

      case 'redeem_discount': {
        const { pointsCost, discountPercentage, validDays } = data;
        
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

        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + (validDays || 30));

        const discount = await RewardsService.createDiscount(
          userId,
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
