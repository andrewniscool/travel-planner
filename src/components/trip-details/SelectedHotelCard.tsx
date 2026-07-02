import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin } from 'lucide-react';
import Card from '../ui/Card';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import RatingStars from '../ui/RatingStars';
import type { Hotel } from '../../types';

interface SelectedHotelCardProps {
  hotel?: Hotel;
}

const SelectedHotelCard: React.FC<SelectedHotelCardProps> = ({ hotel }) => (
  <Card hover={false} className="overflow-hidden">
    <div className="p-6">
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Selected Hotel
      </h2>
    </div>
    {hotel ? (
      <div className="flex flex-col sm:flex-row gap-0 sm:gap-5 px-6 pb-6">
        <div className="w-full sm:w-48 flex-shrink-0">
          <ImagePlaceholder
            src={hotel.image}
            alt={hotel.name}
            aspectRatio="square"
            className="rounded-xl"
          />
        </div>
        <div className="flex-1 pt-3 sm:pt-0 space-y-2">
          <h3 className="font-semibold text-neutral-900">{hotel.name}</h3>
          <RatingStars
            rating={hotel.rating}
            showCount
            count={hotel.reviewCount}
            size="sm"
          />
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            <span className="font-semibold text-primary-600">
              ${hotel.pricePerNight}
              <span className="text-neutral-400 font-normal">/night</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              {hotel.neighborhood}
            </span>
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
        <Building2 className="w-10 h-10 text-neutral-300 mb-3" />
        <p className="text-neutral-600 font-medium mb-1">
          No hotel selected yet
        </p>
        <Link
          to="hotels"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          Browse hotels
        </Link>
      </div>
    )}
  </Card>
);

export default SelectedHotelCard;
