'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewList from '@/components/reviews/ReviewList';
import RatingStars from '@/components/reviews/RatingStars';

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  userId: string;
  user: {
    id: string;
    name: string;
  };
}

export default function ItemReviewsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const itemId = params.itemId as string;

  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const fetchItemDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch item details
        const response = await fetch(`/api/items/${itemId}`);
        if (!response.ok) {
          throw new Error('Failed to load item details');
        }
        const itemData = await response.json();
        setItem(itemData);

        // Fetch reviews for this item to calculate average rating
        const reviewsResponse = await fetch(`/api/reviews?itemId=${itemId}`);
        if (reviewsResponse.ok) {
          const reviews = await reviewsResponse.json();
          setReviewCount(reviews.length);
          
          // Calculate average rating
          if (reviews.length > 0) {
            const total = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
            setAverageRating(total / reviews.length);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (itemId) {
      fetchItemDetails();
    }
  }, [itemId]);

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    // Refetch reviews and recalculate average
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-red-50 p-4 rounded-md">
          <h2 className="text-lg font-medium text-red-800">Error</h2>
          <p className="mt-2 text-sm text-red-700">{error || 'Item not found'}</p>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canReview = session?.user && item.userId !== session.user.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link
          href={`/dashboard/items/${itemId}`}
          className="inline-flex items-center text-sm text-orange-600 hover:text-orange-500"
        >
          &larr; Back to Item Details
        </Link>
      </div>

      {/* Item overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 mb-4 md:mb-0">
            {item.images && item.images.length > 0 ? (
              <Image
                src={item.images[0]}
                alt={item.name}
                width={300}
                height={300}
                className="w-full h-auto object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No image available</span>
              </div>
            )}
          </div>
          
          <div className="md:w-2/3 md:pl-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h1>
            <p className="text-gray-500 mb-4">
              Posted by {item.user.name}
            </p>
            
            <div className="flex items-center mb-4">
              {averageRating ? (
                <>
                  <RatingStars rating={averageRating} />
                  <span className="ml-2 text-sm text-gray-700">
                    {averageRating.toFixed(1)} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500">No reviews yet</span>
              )}
            </div>
            
            <p className="text-gray-700 mb-6">{item.description}</p>
            
            {canReview && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md"
              >
                {showReviewForm ? 'Cancel' : 'Write a Review'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Review form */}
      {showReviewForm && canReview && (
        <div className="mb-8">
          <ReviewForm itemId={itemId} onSuccess={handleReviewSuccess} />
        </div>
      )}

      {/* Reviews list */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
        </h2>
        <ReviewList itemId={itemId} />
      </div>
    </div>
  );
}
