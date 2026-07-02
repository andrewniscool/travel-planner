import React from 'react';
import { Bookmark, CalendarPlus, Eye, ExternalLink, MapPin } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import RatingStars from '../ui/RatingStars';
import type { Place } from '../../types';
import { GOOGLE_PLACE_IMAGE } from '../../services/locationDisplayMappers';
import { getSafeExternalUrl, getSafeImageUrl } from '../../utils/safeUrl';

interface PlaceCardProps {
  place: Place;
  onSave: (placeId: string) => void;
  onAddToItinerary: (placeId: string) => void;
  onViewDetails: (placeId: string) => void;
  isAddingToItinerary?: boolean;
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  onSave,
  onAddToItinerary,
  onViewDetails,
  isAddingToItinerary = false,
}) => {
  const displayName = place.locationRef?.displayName || place.name;
  const displayImage = place.locationRef?.photoUrls?.[0] || place.image;
  const safeDisplayImage = getSafeImageUrl(displayImage) ?? GOOGLE_PLACE_IMAGE;
  const displayRating = place.locationRef?.rating ?? place.rating;
  const displayReviewCount = place.locationRef?.reviewCount ?? place.reviewCount;
  const displayLocation = place.locationRef?.formattedAddress || place.location;
  const displayPrice = place.locationRef?.priceRange || place.priceRange;
  const visitUrl = place.locationRef?.websiteUri || place.locationRef?.googleMapsUri;
  const safeVisitUrl = getSafeExternalUrl(visitUrl);

  return (
    <Card hover={false} className="flex flex-col h-full">
      {/* Image Section */}
      <div className="relative">
        <img
          src={safeDisplayImage}
          alt={displayName}
          loading="lazy"
          decoding="async"
          width={600}
          height={338}
          className="w-full aspect-video object-cover rounded-t-xl"
          onError={(event) => {
            if (event.currentTarget.src !== GOOGLE_PLACE_IMAGE) {
              event.currentTarget.src = GOOGLE_PLACE_IMAGE;
            }
          }}
        />

        {/* Category Badge - top left */}
        <div className="absolute top-3 left-3">
          <Badge variant="default" className="bg-white/90 backdrop-blur-sm text-neutral-700 shadow-sm">
            {place.locationRef?.source === 'google' ? 'Google Places' : place.category}
          </Badge>
        </div>

        {/* Tags - bottom overlaid on image */}
        {place.tags.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
            {place.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/80 backdrop-blur-sm text-neutral-700 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Place Name */}
        <h3 className="font-semibold text-neutral-900 text-base leading-snug">
          {displayName}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <RatingStars rating={displayRating} size="sm" />
          <span className="text-sm text-neutral-500">({displayReviewCount.toLocaleString()})</span>
        </div>

        {/* Price Range */}
        <span className="text-sm font-medium text-neutral-700">{displayPrice}</span>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{displayLocation}</span>
        </div>

        {/* Review Snippet */}
        <p className="text-sm italic text-neutral-500 line-clamp-2 leading-relaxed">
          "{place.reviewSnippet}"
        </p>

        {/* Spacer to push actions to bottom */}
        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <button
            onClick={() => onSave(place.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              place.isSaved
                ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${place.isSaved ? 'fill-current' : ''}`} />
            {place.isSaved ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={() => onAddToItinerary(place.id)}
            disabled={isAddingToItinerary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            {isAddingToItinerary ? 'Adding' : 'Add'}
          </button>

          <button
            onClick={() => onViewDetails(place.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>

          {safeVisitUrl && (
            <a
              href={safeVisitUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors ml-auto"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Visit
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PlaceCard;
