'use client';

import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface RatingStarsProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showEmpty?: boolean;
}

export default function RatingStars({ 
  rating, 
  size = 'md', 
  showEmpty = true 
}: RatingStarsProps) {
  const starCount = 5;
  const filledStars = Math.round(rating);
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
  };
  
  const starClass = sizeClasses[size];
  
  return (
    <div className="flex">
      {Array.from({ length: starCount }).map((_, index) => {
        if (index < filledStars) {
          return (
            <StarIcon
              key={index}
              className={`${starClass} text-yellow-400`}
              aria-hidden="true"
            />
          );
        } else if (showEmpty) {
          return (
            <StarOutline
              key={index}
              className={`${starClass} text-gray-300`}
              aria-hidden="true"
            />
          );
        }
        return null;
      })}
    </div>
  );
}
