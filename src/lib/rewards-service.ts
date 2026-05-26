import { Discount } from '../types/rewards';

// Stub RewardsService for development purposes
// Replace with actual implementation when ready
export const RewardsService = {
  async validateDiscount(code: string, _orderAmount: number): Promise<Discount | null> {
    // TODO: Implement actual discount validation
    console.warn('[RewardsService] validateDiscount not fully implemented');
    return null;
  },

  async useDiscount(
    _discountId: string,
    _orderAmount: number,
    _orderId: string
  ): Promise<number> {
    // TODO: Implement actual discount usage
    console.warn('[RewardsService] useDiscount not fully implemented');
    return 0;
  },
};
