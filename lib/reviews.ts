import { prisma } from '@/lib/prisma';
import { createNotification } from './notifications';

interface CreateReviewParams {
  rating: number;
  comment?: string;
  itemId: string;
  reviewerId: string;
  ownerId: string;
  requestId?: string;
}

/**
 * Create a new review for an item
 */
export async function createReview({
  rating,
  comment,
  itemId,
  reviewerId,
  ownerId,
  requestId,
}: CreateReviewParams) {
  // Validate rating is between 1-5
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if reviewer has already reviewed this item
  const existingReview = await prisma.review.findFirst({
    where: {
      itemId,
      reviewerId,
      requestId,
    },
  });

  if (existingReview) {
    throw new Error('You have already reviewed this item');
  }

  // Create the review
  const review = await prisma.review.create({
    data: {
      rating,
      comment,
      itemId,
      reviewerId,
      ownerId,
      requestId,
    },
    include: {
      reviewer: {
        select: {
          name: true,
        },
      },
      item: {
        select: {
          name: true,
        },
      },
    },
  });

  // Send notification to item owner
  await createNotification({
    userId: ownerId,
    type: 'REVIEW_RECEIVED',
    title: 'New Review Received',
    message: `${review.reviewer.name} left a ${rating}-star review for your item "${review.item.name}"`,
    relatedId: review.id,
  });

  return review;
}

/**
 * Get reviews for an item
 */
export async function getItemReviews(itemId: string) {
  return await prisma.review.findMany({
    where: { itemId },
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get reviews by a user
 */
export async function getUserGivenReviews(userId: string) {
  return await prisma.review.findMany({
    where: { reviewerId: userId },
    include: {
      item: {
        select: {
          id: true,
          name: true,
          images: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get reviews received by a user (as item owner)
 */
export async function getUserReceivedReviews(userId: string) {
  return await prisma.review.findMany({
    where: { ownerId: userId },
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      item: {
        select: {
          id: true,
          name: true,
          images: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Calculate average rating for an item
 */
export async function getItemAverageRating(itemId: string) {
  const reviews = await prisma.review.findMany({
    where: { itemId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return null;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return totalRating / reviews.length;
}

/**
 * Calculate average rating for a user (as item owner)
 */
export async function getUserAverageRating(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { ownerId: userId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    return null;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return totalRating / reviews.length;
}
