import React from 'react';
import { Bookmark, Check, ExternalLink, MapPin } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import RatingStars from '../ui/RatingStars';
import { GOOGLE_HOTEL_IMAGE } from '../../services/locationDisplayMappers';
import type { Hotel } from '../../types';
import {
  amenityIcons,
  getGooglePhoto,
  getGoogleRating,
  getGoogleReviewCount,
  getGoogleTypes,
  getLocationLabel,
} from './hotelDisplay';

interface HotelCardProps {
  hotel: Hotel;
  isSelected: boolean;
  onSelect: () => void;
  onSave: () => void;
  onViewDetails: () => void;
}

const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  isSelected,
  onSelect,
  onSave,
  onViewDetails,
}) => (
  <Card
    hover={false}
    className={[
      'transition-all duration-200 overflow-hidden',
      isSelected ? 'border-primary-500 bg-primary-50/30' : 'border-neutral-100 bg-white',
    ].join(' ')}
  >
    <div className="flex flex-col sm:flex-row">
      <div className="sm:w-48 sm:shrink-0">
        <img
          src={getGooglePhoto(hotel)}
          alt={hotel.name}
          loading="lazy"
          decoding="async"
          width={320}
          height={192}
          className="w-full h-48 sm:h-full object-cover sm:rounded-l-xl"
          onError={(event) => {
            if (event.currentTarget.src !== GOOGLE_HOTEL_IMAGE) {
              event.currentTarget.src = GOOGLE_HOTEL_IMAGE;
            }
          }}
        />
      </div>

      <div className="flex-1 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-neutral-900 text-base truncate">
                {hotel.locationRef?.displayName || hotel.name}
              </h3>
              <Badge variant={hotel.locationRef?.source === 'google' ? 'success' : 'default'}>
                {hotel.locationRef?.source === 'google' ? 'Google' : 'Places-ready'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <RatingStars rating={getGoogleRating(hotel)} size="sm" />
              <span className="text-xs text-neutral-500">
                ({getGoogleReviewCount(hotel).toLocaleString()} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{getLocationLabel(hotel)}</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">{hotel.distanceToCenter}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {getGoogleTypes(hotel.locationRef).slice(0, 3).map((type) => (
            <span
              key={type}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-50 text-primary-700 border border-primary-100 capitalize"
            >
              {type}
            </span>
          ))}
          {hotel.amenities.slice(0, 4).map((amenity) => (
            <span
              key={amenity}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-50 text-neutral-600 border border-neutral-100"
            >
              {amenityIcons[amenity] || null}
              {amenity}
            </span>
          ))}
        </div>

        <p className="text-sm text-neutral-500 line-clamp-2">{hotel.description}</p>

        <div className="flex items-center gap-1.5 mt-auto pt-1 flex-wrap">
          <Button variant="ghost" size="sm" onClick={onSave}>
            <Bookmark className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`} />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={onViewDetails}>
            View Details
          </Button>
          <Button variant={isSelected ? 'primary' : 'outline'} size="sm" onClick={onSelect}>
            <Check className="w-4 h-4 mr-1" />
            Select
          </Button>
          {hotel.locationRef?.googleMapsUri && (
            <a href={hotel.locationRef.googleMapsUri} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                Map
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  </Card>
);

export default HotelCard;
