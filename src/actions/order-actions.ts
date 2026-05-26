'use server';

import { OrderService } from '@/src/lib/order-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Freeze an order's payout (admin action)
 * This holds the vendor's funds pending manual review or return verification
 */
export async function freezeOrderPayout(
  orderId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    // TODO: Add admin role check here
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    await OrderService.freezeOrderPayout(orderId, reason);
    
    return { success: true };
  } catch (error) {
    console.error('Error freezing order payout:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to freeze order payout'
    };
  }
}

/**
 * Release a frozen order's payout
 * This allows the payout to proceed when return verification is complete
 */
export async function releaseOrderPayout(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    // TODO: Add admin role check here
    if (!session?.user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    await OrderService.releaseOrderPayout(orderId);
    
    return { success: true };
  } catch (error) {
    console.error('Error releasing order payout:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to release order payout'
    };
  }
}
