import React from 'react';
import { Building2 } from 'lucide-react';
import Card from '../ui/Card';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import RatingStars from '../ui/RatingStars';
import type { Hotel } from '../../types';

interface SelectedHotelSummaryCardProps {
  hotel?: Hotel;
}

const SelectedHotelSummaryCard: React.FC<SelectedHotelSummaryCardProps> = ({
  hotel,
}) => (
  <Card hover={false} className="p-6">
    <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
      <Building2 className="w-5 h-5 text-accent-500" />
      Selected Hotel
    </h2>
    {hotel ? (
      <div className="flex gap-4 bg-neutral-50 rounded-xl p-4">
        <div className="w-24 h-24 shrink-0">
          <ImagePlaceholder
            src={hotel.image}
            alt={hotel.name}
            className="rounded-lg w-full h-full"
            aspectRatio="square"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-neutral-800">
            {hotel.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={hotel.rating} size="sm" />
            <span className="text-xs text-neutral-400">
              ({hotel.reviewCount.toLocaleString()} reviews)
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
            <span>${hotel.pricePerNight}/night</span>
            <span>{hotel.neighborhood}</span>
          </div>
          <p className="text-sm font-semibold text-neutral-800 mt-1">
            ${hotel.totalCost.toLocaleString()} total
          </p>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Building2 className="w-8 h-8 text-neutral-300 mb-2" />
        <p className="text-sm text-neutral-500">No hotel selected</p>
      </div>
    )}
  </Card>
);

export default SelectedHotelSummaryCard;
