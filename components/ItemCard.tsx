'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RatingStars from './reviews/RatingStars';

interface ItemCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  location: string;
}

export default function ItemCard({
  id,
  name,
  description,
  price,
  images,
  category,
  location,
}: ItemCardProps) {
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    // Fetch rating for this item
    const fetchRating = async () => {
      try {
        const response = await fetch(`/api/reviews?itemId=${id}`);
        if (response.ok) {
          const reviews = await response.json();
          setReviewCount(reviews.length);
          
          if (reviews.length > 0) {
            const total = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
            setAverageRating(total / reviews.length);
          }
        }
      } catch (error) {
        console.error('Error fetching item rating:', error);
      }
    };

    fetchRating();
  }, [id]);

  // Truncate description to 100 characters
  const truncatedDescription = description.length > 100
    ? `${description.substring(0, 100)}...`
    : description;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
      <Link href={`/dashboard/items/${id}`}>
        <div className="h-48 w-full relative">
          {images && images.length > 0 ? (
            <Image
              src={images[0]}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/dashboard/items/${id}`} className="hover:underline">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{name}</h3>
          </Link>
          <span className="text-orange-600 font-bold">${price}/day</span>
        </div>
        
        <div className="flex items-center mb-2">
          {averageRating ? (
            <>
              <RatingStars rating={averageRating} size="sm" showEmpty={false} />
              <span className="ml-1 text-xs text-gray-600">
                ({reviewCount})
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-500">No reviews yet</span>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{truncatedDescription}</p>
        
        <div className="flex justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <span>{category}</span>
          </div>
          
          <div className="flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
