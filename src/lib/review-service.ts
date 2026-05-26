// Stub ReviewService for development purposes
// Replace with actual implementation when ready

interface ReviewData {
  rating: number;
  comment: string;
  orderId: string;
  revieweeId: string;
  reviewType: 'renter_to_owner' | 'owner_to_renter';
}

export const ReviewService = {
  async getUserReviews(
    _userId: string,
    _type?: 'received' | 'given',
    _limit?: number
  ): Promise<any[]> {
    // TODO: Implement actual user reviews fetching
    console.warn('[ReviewService] getUserReviews not fully implemented');
    return [];
  },

  async createReview(
    _reviewData: ReviewData,
    _reviewerId: string
  ): Promise<string> {
    // TODO: Implement actual review creation
    console.warn('[ReviewService] createReview not fully implemented');
    return 'stub-review-id';
  },

  async canUserReviewOrder(
    _orderId: string,
    _userId: string
  ): Promise<{ canReview: boolean; reviewType?: string }> {
    // TODO: Implement actual review eligibility check
    console.warn('[ReviewService] canUserReviewOrder not fully implemented');
    return { canReview: true, reviewType: 'renter_to_owner' };
  },

  async getReviewStats(_userId: string): Promise<any> {
    // TODO: Implement actual review stats fetching
    console.warn('[ReviewService] getReviewStats not fully implemented');
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  },
};
