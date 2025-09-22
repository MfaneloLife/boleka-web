'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RatingStars from '@/components/reviews/RatingStars';
import SendMessageModal from '@/components/SendMessageModal';
import { auth } from '@/src/lib/firebase';

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrls: string;
  location: string;
  category: string;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    image: string | null;
  };
}

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;

  const [item, setItem] = useState<Item | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

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
            type Review = { rating: number };
            const total = (reviews as Review[]).reduce((sum: number, review: Review) => sum + review.rating, 0);
            setAverageRating(total / reviews.length);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load item details');
      } finally {
        setIsLoading(false);
      }
    };

    if (itemId) {
      fetchItemDetails();
    }
  }, [itemId]);

  const handleRequestItem = async () => {
    if (!auth.currentUser) {
      router.push('/auth/login');
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          itemId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create request');
      }

      router.push('/dashboard/client/requests');
    } catch (err: unknown) {
      console.error('Error creating request:', err);
      // Handle error here
    }
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
              href="/dashboard/client/search"
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              &larr; Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = auth.currentUser && item.ownerId === auth.currentUser.uid;
  const images = item.imageUrls ? JSON.parse(item.imageUrls) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link
          href="/dashboard/client/search"
          className="inline-flex items-center text-sm text-orange-600 hover:text-orange-500"
        >
          &larr; Back to Search
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Image Gallery */}
          <div className="md:w-1/2">
            <div className="relative h-80 w-full">
              {images.length > 0 ? (
                <Image
                  src={images[0]}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex overflow-x-auto p-2 space-x-2">
                {images.slice(1).map((image: string, index: number) => (
                  <div key={index} className="w-24 h-24 flex-shrink-0 relative">
                    <Image
                      src={image}
                      alt={`${item.title} - image ${index + 2}`}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="md:w-1/2 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
                <div className="flex items-center mt-2">
                  {averageRating ? (
                    <div className="flex items-center">
                      <RatingStars rating={averageRating} size="sm" />
                      <Link href={`/dashboard/items/${itemId}/reviews`} className="ml-2 text-sm text-gray-600 hover:underline">
                        {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/dashboard/items/${itemId}/reviews`} className="text-sm text-gray-500 hover:underline">
                      No reviews yet
                    </Link>
                  )}
                </div>
              </div>
              <p className="text-2xl font-bold text-orange-600">${item.price}/day</p>
            </div>

            <div className="mt-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {item.owner.image ? (
                    <Image
                      src={item.owner.image}
                      alt={item.owner.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-800 font-medium">
                        {item.owner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Posted by {item.owner.name}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">Description</h3>
              <p className="mt-2 text-gray-600">{item.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1 text-sm text-gray-900">{item.category}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1 text-sm text-gray-900">{item.location}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              {isOwner ? (
                <Link
                  href={`/dashboard/business/items/${itemId}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Edit Item
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleRequestItem}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Request Item
                  </button>
                  <button
                    onClick={() => setIsMessageModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Contact Owner
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Preview Section */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Reviews
            </h3>
            <Link
              href={`/dashboard/items/${itemId}/reviews`}
              className="text-sm font-medium text-orange-600 hover:text-orange-500"
            >
              View all reviews &rarr;
            </Link>
          </div>
        </div>
      </div>
      
      {/* Message Modal */}
      <SendMessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        recipientId={item.ownerId}
        recipientName={item.owner.name}
        itemId={item.id}
      />
    </div>
  );
}
