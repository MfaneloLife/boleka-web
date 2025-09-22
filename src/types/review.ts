import { Timestamp } from 'firebase/firestore';

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerEmail: string;
  revieweeId: string;
  revieweeName: string;
  revieweeEmail: string;
  orderId: string;
  itemId: string;
  itemTitle: string;
  rating: number; // 1-5 stars
  comment: string;
  reviewType: 'renter_to_owner' | 'owner_to_renter';
  isPublic: boolean;
  isVerified: boolean; // Only verified after completed transaction
  reportCount: number;
  isHidden: boolean; // Hidden due to reports/moderation
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserRating {
  userId: string;
  email: string;
  name: string;
  // Overall ratings
  overallRating: number;
  totalReviews: number;
  
  // As renter ratings
  renterRating: number;
  renterReviewCount: number;
  
  // As owner ratings  
  ownerRating: number;
  ownerReviewCount: number;
  
  // Rating breakdown
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  
  // Recent reviews (for quick display)
  recentReviews: Review[];
  
  updatedAt: Timestamp;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewFormData {
  rating: number;
  comment: string;
  orderId: string;
  revieweeId: string;
  reviewType: 'renter_to_owner' | 'owner_to_renter';
}

// Helper functions
export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
};

export const getRatingDisplay = (rating: number): string => {
  return `${rating.toFixed(1)} ⭐`;
};

export const getRatingText = (rating: number): string => {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Average';
  if (rating >= 2.0) return 'Below Average';
  return 'Poor';
};

export const canLeaveReview = (
  order: any, 
  currentUserId: string, 
  existingReviews: Review[]
): boolean => {
  // Can only leave review if order is completed
  if (order.status !== 'completed') return false;
  
  // Can only leave review if user was part of the transaction
  const isOwner = order.vendorId === currentUserId;
  const isRenter = order.userId === currentUserId;
  
  if (!isOwner && !isRenter) return false;
  
  // Check if review already exists
  const reviewType = isOwner ? 'owner_to_renter' : 'renter_to_owner';
  const existingReview = existingReviews.find(
    review => review.orderId === order.id && 
             review.reviewType === reviewType &&
             review.reviewerId === currentUserId
  );
  
  return !existingReview;
};