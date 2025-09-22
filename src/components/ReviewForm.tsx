'use client';

import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { ReviewFormData } from '@/src/types/review';

interface ReviewFormProps {
  orderId: string;
  revieweeId: string;
  revieweeName: string;
  reviewType: 'renter_to_owner' | 'owner_to_renter';
  onSubmit: (reviewData: ReviewFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function ReviewForm({
  orderId,
  revieweeId,
  revieweeName,
  reviewType,
  onSubmit,
  onCancel,
  loading = false
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      alert('Please provide a comment with at least 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData: ReviewFormData = {
        rating,
        comment: comment.trim(),
        orderId,
        revieweeId,
        reviewType
      };

      await onSubmit(reviewData);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Below Average';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  const getReviewTitle = () => {
    if (reviewType === 'renter_to_owner') {
      return `Rate your experience with ${revieweeName}`;
    } else {
      return `Rate ${revieweeName} as a renter`;
    }
  };

  const getPlaceholderText = () => {
    if (reviewType === 'renter_to_owner') {
      return `Share your experience renting from ${revieweeName}. How was the item condition, communication, and overall service?`;
    } else {
      return `Share your experience with ${revieweeName} as a renter. How was their communication, item care, and return timeliness?`;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        {getReviewTitle()}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rating *
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              >
                {star <= (hoveredRating || rating) ? (
                  <StarIcon className="h-8 w-8 text-yellow-400" />
                ) : (
                  <StarOutlineIcon className="h-8 w-8 text-gray-300" />
                )}
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-600">
              {getRatingText(hoveredRating || rating)}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={getPlaceholderText()}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={submitting || loading}
          />
          <p className="mt-2 text-sm text-gray-500">
            Minimum 10 characters ({comment.length}/500)
          </p>
        </div>

        {/* Review Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Review Guidelines:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Be honest and constructive in your feedback</li>
            <li>• Focus on the rental experience and item condition</li>
            <li>• Avoid personal attacks or inappropriate language</li>
            <li>• Reviews help build trust in our community</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={submitting || loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting || loading || rating === 0 || comment.trim().length < 10}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}