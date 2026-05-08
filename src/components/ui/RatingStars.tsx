import React from 'react';
import { Star, StarHalf } from 'lucide-react';

type RatingStarsSize = 'sm' | 'md';

interface RatingStarsProps {
  rating: number;
  showCount?: boolean;
  count?: number;
  size?: RatingStarsSize;
  className?: string;
}

const sizeClasses: Record<RatingStarsSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4.5 h-4.5',
};

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  showCount = false,
  count,
  size = 'md',
  className = '',
}) => {
  const clampedRating = Math.min(5, Math.max(0, rating));
  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div
      className={['flex items-center gap-0.5', className]
        .filter(Boolean)
        .join(' ')}
    >
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`${sizeClasses[size]} text-warning-400 fill-warning-400`}
        />
      ))}
      {hasHalfStar && (
        <StarHalf
          className={`${sizeClasses[size]} text-warning-400 fill-warning-400`}
        />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-neutral-200`}
        />
      ))}
      {showCount && count !== undefined && (
        <span className="ml-1 text-sm text-neutral-500">({count})</span>
      )}
    </div>
  );
};

export default RatingStars;
