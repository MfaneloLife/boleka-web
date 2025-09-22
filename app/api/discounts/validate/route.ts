import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { RewardsService } from '@/src/lib/rewards-service';

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
    const { code, orderAmount } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    if (!orderAmount || orderAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid order amount is required' },
        { status: 400 }
      );
    }

    // Validate the discount code
    const discount = await RewardsService.validateDiscount(code, orderAmount);

    if (!discount) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid or expired discount code'
        },
        { status: 404 }
      );
    }

    // Check if user owns this discount
    if (discount.userId !== session.user.id) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'This discount code belongs to another user'
        },
        { status: 403 }
      );
    }

    // Calculate discount amount
    const { calculateDiscountAmount } = await import('@/src/types/rewards');
    const discountAmount = calculateDiscountAmount(discount, orderAmount);

    return NextResponse.json({
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        discountAmount,
        validUntil: discount.validUntil.toDate().toISOString(),
        minimumOrderAmount: discount.minimumOrderAmount
      }
    });

  } catch (error) {
    console.error('Error validating discount:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { discountId, orderAmount, orderId, action } = body;

    if (action === 'use') {
      if (!discountId || !orderAmount || !orderId) {
        return NextResponse.json(
          { error: 'Discount ID, order amount, and order ID are required' },
          { status: 400 }
        );
      }

      // Use the discount
      const discountAmount = await RewardsService.useDiscount(
        discountId,
        orderAmount,
        orderId
      );

      return NextResponse.json({
        success: true,
        discountAmount,
        message: 'Discount applied successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing discount:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Discount not found') {
        return NextResponse.json(
          { error: 'Discount not found' },
          { status: 404 }
        );
      }
      
      if (error.message === 'Discount is not valid') {
        return NextResponse.json(
          { error: 'This discount code has already been used or is no longer valid' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process discount' },
      { status: 500 }
    );
  }
}