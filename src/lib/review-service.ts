import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Review, UserRating, ReviewFormData, ReviewStats } from '@/src/types/review';

export class ReviewService {
  private static readonly REVIEWS_COLLECTION = 'reviews';
  private static readonly USER_RATINGS_COLLECTION = 'userRatings';

  // Create a new review
  static async createReview(reviewData: ReviewFormData, reviewerId: string): Promise<string> {
    try {
      // Get reviewer info
      const reviewerDoc = await getDoc(doc(db, 'users', reviewerId));
      if (!reviewerDoc.exists()) {
        throw new Error('Reviewer not found');
      }
      const reviewerInfo = reviewerDoc.data();

      // Get reviewee info
      const revieweeDoc = await getDoc(doc(db, 'users', reviewData.revieweeId));
      if (!revieweeDoc.exists()) {
        throw new Error('Reviewee not found');
      }
      const revieweeInfo = revieweeDoc.data();

      // Get order info to get item details
      const orderDoc = await getDoc(doc(db, 'orders', reviewData.orderId));
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      const orderInfo = orderDoc.data();
      const firstItem = orderInfo.items[0]; // Get first item for review context

      // Create review document
      const review: Omit<Review, 'id'> = {
        reviewerId,
        reviewerName: reviewerInfo.name || reviewerInfo.displayName,
        reviewerEmail: reviewerInfo.email,
        revieweeId: reviewData.revieweeId,
        revieweeName: revieweeInfo.name || revieweeInfo.displayName,
        revieweeEmail: revieweeInfo.email,
        orderId: reviewData.orderId,
        itemId: firstItem.itemId,
        itemTitle: firstItem.itemName,
        rating: reviewData.rating,
        comment: reviewData.comment,
        reviewType: reviewData.reviewType,
        isPublic: true,
        isVerified: true, // Auto-verify since it's from completed transaction
        reportCount: 0,
        isHidden: false,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      // Add review to database
      const reviewRef = await addDoc(collection(db, this.REVIEWS_COLLECTION), review);

      // Update user ratings
      await this.updateUserRating(reviewData.revieweeId);

      return reviewRef.id;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Get reviews for a user
  static async getUserReviews(
    userId: string, 
    reviewType?: 'received' | 'given',
    limitCount: number = 10
  ): Promise<Review[]> {
    try {
      let reviewsQuery;
      
      if (reviewType === 'received') {
        reviewsQuery = query(
          collection(db, this.REVIEWS_COLLECTION),
          where('revieweeId', '==', userId),
          where('isHidden', '==', false),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else if (reviewType === 'given') {
        reviewsQuery = query(
          collection(db, this.REVIEWS_COLLECTION),
          where('reviewerId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      } else {
        // Get all reviews (both given and received)
        const receivedQuery = query(
          collection(db, this.REVIEWS_COLLECTION),
          where('revieweeId', '==', userId),
          where('isHidden', '==', false),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        
        const givenQuery = query(
          collection(db, this.REVIEWS_COLLECTION),
          where('reviewerId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        const [receivedSnapshot, givenSnapshot] = await Promise.all([
          getDocs(receivedQuery),
          getDocs(givenQuery)
        ]);

        const allReviews = [
          ...receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)),
          ...givenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review))
        ];

        // Sort by date and limit
        return allReviews
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
          .slice(0, limitCount);
      }

      const snapshot = await getDocs(reviewsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
    } catch (error) {
      console.error('Error getting user reviews:', error);
      throw error;
    }
  }

  // Get reviews for an order
  static async getOrderReviews(orderId: string): Promise<Review[]> {
    try {
      const reviewsQuery = query(
        collection(db, this.REVIEWS_COLLECTION),
        where('orderId', '==', orderId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(reviewsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Review));
    } catch (error) {
      console.error('Error getting order reviews:', error);
      throw error;
    }
  }

  // Update user rating aggregate
  static async updateUserRating(userId: string): Promise<void> {
    try {
      // Get all reviews for this user (received only)
      const reviewsQuery = query(
        collection(db, this.REVIEWS_COLLECTION),
        where('revieweeId', '==', userId),
        where('isHidden', '==', false)
      );

      const snapshot = await getDocs(reviewsQuery);
      const reviews = snapshot.docs.map(doc => doc.data() as Review);

      if (reviews.length === 0) {
        // No reviews yet, create default rating
        const userRating: Omit<UserRating, 'userId'> = {
          email: '',
          name: '',
          overallRating: 0,
          totalReviews: 0,
          renterRating: 0,
          renterReviewCount: 0,
          ownerRating: 0,
          ownerReviewCount: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          recentReviews: [],
          updatedAt: serverTimestamp() as Timestamp,
        };

        await updateDoc(doc(db, this.USER_RATINGS_COLLECTION, userId), userRating);
        return;
      }

      // Calculate rating statistics
      const renterReviews = reviews.filter(r => r.reviewType === 'owner_to_renter');
      const ownerReviews = reviews.filter(r => r.reviewType === 'renter_to_owner');

      const renterRating = renterReviews.length > 0 
        ? renterReviews.reduce((sum, r) => sum + r.rating, 0) / renterReviews.length 
        : 0;

      const ownerRating = ownerReviews.length > 0 
        ? ownerReviews.reduce((sum, r) => sum + r.rating, 0) / ownerReviews.length 
        : 0;

      const overallRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      // Calculate rating breakdown
      const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(review => {
        const rating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
        ratingBreakdown[rating]++;
      });

      // Get recent reviews (last 5)
      const recentReviews = reviews
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .slice(0, 5);

      // Get user info
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : {};

      const userRating: UserRating = {
        userId,
        email: userData.email || '',
        name: userData.name || userData.displayName || '',
        overallRating: Math.round(overallRating * 10) / 10,
        totalReviews: reviews.length,
        renterRating: Math.round(renterRating * 10) / 10,
        renterReviewCount: renterReviews.length,
        ownerRating: Math.round(ownerRating * 10) / 10,
        ownerReviewCount: ownerReviews.length,
        ratingBreakdown,
        recentReviews,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await updateDoc(doc(db, this.USER_RATINGS_COLLECTION, userId), userRating as any);
    } catch (error) {
      console.error('Error updating user rating:', error);
      throw error;
    }
  }

  // Get user rating
  static async getUserRating(userId: string): Promise<UserRating | null> {
    try {
      const ratingDoc = await getDoc(doc(db, this.USER_RATINGS_COLLECTION, userId));
      
      if (!ratingDoc.exists()) {
        // Initialize user rating if it doesn't exist
        await this.updateUserRating(userId);
        const newRatingDoc = await getDoc(doc(db, this.USER_RATINGS_COLLECTION, userId));
        return newRatingDoc.exists() ? newRatingDoc.data() as UserRating : null;
      }

      return ratingDoc.data() as UserRating;
    } catch (error) {
      console.error('Error getting user rating:', error);
      throw error;
    }
  }

  // Report a review
  static async reportReview(reviewId: string, reportReason: string): Promise<void> {
    try {
      const reviewRef = doc(db, this.REVIEWS_COLLECTION, reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }

      const currentReportCount = reviewDoc.data().reportCount || 0;
      const newReportCount = currentReportCount + 1;

      await updateDoc(reviewRef, {
        reportCount: newReportCount,
        isHidden: newReportCount >= 3, // Hide after 3 reports
        updatedAt: serverTimestamp(),
      });

      // If hidden, update user rating
      if (newReportCount >= 3) {
        const reviewData = reviewDoc.data() as Review;
        await this.updateUserRating(reviewData.revieweeId);
      }
    } catch (error) {
      console.error('Error reporting review:', error);
      throw error;
    }
  }

  // Get review stats for a user
  static async getReviewStats(userId: string): Promise<ReviewStats> {
    try {
      const userRating = await this.getUserRating(userId);
      
      if (!userRating) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      return {
        averageRating: userRating.overallRating,
        totalReviews: userRating.totalReviews,
        ratingDistribution: userRating.ratingBreakdown
      };
    } catch (error) {
      console.error('Error getting review stats:', error);
      throw error;
    }
  }

  // Check if user can leave review for order
  static async canUserReviewOrder(
    orderId: string, 
    userId: string
  ): Promise<{ canReview: boolean; reviewType?: 'renter_to_owner' | 'owner_to_renter' }> {
    try {
      // Get order details
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (!orderDoc.exists()) {
        return { canReview: false };
      }

      const order = orderDoc.data();
      
      // Can only review completed orders
      if (order.status !== 'completed') {
        return { canReview: false };
      }

      // Determine review type
      let reviewType: 'renter_to_owner' | 'owner_to_renter';
      if (order.userId === userId) {
        reviewType = 'renter_to_owner';
      } else if (order.vendorId === userId) {
        reviewType = 'owner_to_renter';
      } else {
        return { canReview: false };
      }

      // Check if review already exists
      const existingReviewQuery = query(
        collection(db, this.REVIEWS_COLLECTION),
        where('orderId', '==', orderId),
        where('reviewerId', '==', userId),
        where('reviewType', '==', reviewType)
      );

      const existingReviewSnapshot = await getDocs(existingReviewQuery);
      
      if (existingReviewSnapshot.empty) {
        return { canReview: true, reviewType };
      } else {
        return { canReview: false };
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return { canReview: false };
    }
  }
}