'use client';

import { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Review, ReviewStats } from '@/src/types/review';

interface ReviewDisplayProps {
  userId: string;
  userType?: 'renter' | 'owner' | 'both';
  maxReviews?: number;
  showStats?: boolean;
}

export default function ReviewDisplay({ 
  userId, 
  userType = 'both',
  maxReviews = 10,
  showStats = true 
}: ReviewDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'renter' | 'owner'>('all');

  useEffect(() => {
    fetchReviews();
    if (showStats) {
      fetchStats();
    }
  }, [userId, userType]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?userId=${userId}&type=received&limit=${maxReviews}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/reviews/stats?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  const toggleReviewExpansion = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews);
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId);
    } else {
      newExpanded.add(reviewId);
    }
    setExpandedReviews(newExpanded);
  };

  const filteredReviews = reviews.filter(review => {
    if (filterType === 'all') return true;
    if (filterType === 'renter') return review.reviewType === 'owner_to_renter';
    if (filterType === 'owner') return review.reviewType === 'renter_to_owner';
    return true;
  });

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const renderRatingBreakdown = () => {
    if (!stats) return null;

    const total = stats.totalReviews;
    const distribution = stats.ratingDistribution;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating as keyof typeof distribution];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 w-12">
                <span className="text-sm">{rating}</span>
                <StarIcon className="h-3 w-3 text-yellow-400" />
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      {showStats && stats && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                {renderStars(stats.averageRating)}
              </div>
              <div className="text-sm text-gray-600">
                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Rating Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Rating Breakdown</h4>
              {renderRatingBreakdown()}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {userType === 'both' && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Reviews', count: reviews.length },
              { key: 'renter', label: 'As Renter', count: reviews.filter(r => r.reviewType === 'owner_to_renter').length },
              { key: 'owner', label: 'As Owner', count: reviews.filter(r => r.reviewType === 'renter_to_owner').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterType(key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filterType === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label}
                {count > 0 && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No reviews to display</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const isExpanded = expandedReviews.has(review.id);
            const shouldTruncate = review.comment.length > 200;
            const displayComment = shouldTruncate && !isExpanded 
              ? review.comment.substring(0, 200) + '...'
              : review.comment;

            return (
              <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  {/* Reviewer Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {review.reviewerName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Reviewer Info and Rating */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {review.reviewerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {review.reviewType === 'owner_to_renter' ? 'Rented from you' : 'You rented from them'} • 
                          {review.itemTitle}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {displayComment}
                      </p>
                      
                      {shouldTruncate && (
                        <button
                          onClick={() => toggleReviewExpansion(review.id)}
                          className="mt-2 flex items-center text-xs text-blue-600 hover:text-blue-500"
                        >
                          {isExpanded ? (
                            <>
                              Show less <ChevronUpIcon className="h-3 w-3 ml-1" />
                            </>
                          ) : (
                            <>
                              Show more <ChevronDownIcon className="h-3 w-3 ml-1" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Verification Badge */}
                    {review.isVerified && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified Transaction
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {filteredReviews.length >= maxReviews && (
        <div className="text-center">
          <button className="text-blue-600 hover:text-blue-500 text-sm font-medium">
            View All Reviews
          </button>
        </div>
      )}
    </div>
  );
}