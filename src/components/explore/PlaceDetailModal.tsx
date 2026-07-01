import React from 'react';
import { Bookmark, CalendarPlus, ExternalLink, MapPin, Clock, DollarSign, User } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import RatingStars from '../ui/RatingStars';
import type { Place } from '../../types';
import { GOOGLE_PLACE_IMAGE } from '../../services/locationDisplayMappers';
import PhotoGallery from '../ui/PhotoGallery';

interface PlaceDetailModalProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (placeId: string) => void;
  onAddToItinerary?: (placeId: string) => void;
  isAddingToItinerary?: boolean;
}

const mockReviews = [
  {
    author: 'Sarah M.',
    rating: 5,
    text: 'Absolutely incredible experience. The atmosphere, the attention to detail, everything was perfect. Would highly recommend to anyone visiting.',
  },
  {
    author: 'David K.',
    rating: 4,
    text: 'Great spot overall. A bit crowded during peak hours but the quality makes up for it. Get there early for the best experience.',
  },
  {
    author: 'Mia L.',
    rating: 5,
    text: 'One of the highlights of our trip. We went based on a friend\'s recommendation and it exceeded all expectations. Don\'t miss this place!',
  },
];

const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  isOpen,
  onClose,
  onSave,
  onAddToItinerary,
  isAddingToItinerary = false,
}) => {
  if (!place) return null;

  const displayName = place.locationRef?.displayName || place.name;
  const displayImages = place.locationRef?.photoUrls?.length
    ? place.locationRef.photoUrls
    : place.image
      ? [place.image]
      : [];
  const displayRating = place.locationRef?.rating ?? place.rating;
  const displayReviewCount = place.locationRef?.reviewCount ?? place.reviewCount;
  const displayLocation = place.locationRef?.formattedAddress || place.location;
  const displayPrice = place.locationRef?.priceRange || place.priceRange;
  const visitUrl = place.locationRef?.websiteUri || place.locationRef?.googleMapsUri;
  const description =
    place.description ||
    `${displayName} is a must-visit ${place.category.toLowerCase().replace(/s$/, '')} located in ${displayLocation}. Known for its exceptional quality and unique atmosphere, it has earned a ${displayRating}-star rating from ${displayReviewCount.toLocaleString()} reviews. Visitors consistently praise the experience and recommend adding it to your itinerary.`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={displayName} size="lg">
      <div className="space-y-5">
        {/* Large Image */}
        <div className="relative rounded-xl overflow-hidden -mx-6 -mt-6">
          <PhotoGallery
            photos={displayImages}
            fallbackPhoto={GOOGLE_PLACE_IMAGE}
            alt={displayName}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-white/90 backdrop-blur-sm text-neutral-700">
                {place.category}
              </Badge>
            </div>
          </div>
        </div>

        {/* Name, Category Badge, Rating */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-neutral-900">{displayName}</h3>
            <Badge variant="default">
              {place.locationRef?.source === 'google' ? 'Google Places' : place.category}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <RatingStars rating={displayRating} size="sm" showCount count={displayReviewCount} />
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-600 leading-relaxed">{description}</p>

        {/* Details: Location, Hours, Price */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50">
            <MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-neutral-500 font-medium">Location</p>
              <p className="text-sm text-neutral-800">{displayLocation}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50">
            <Clock className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-neutral-500 font-medium">Hours</p>
              <p className="text-sm text-neutral-800">{place.hours || 'Check website'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50">
            <DollarSign className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-neutral-500 font-medium">Price Range</p>
              <p className="text-sm text-neutral-800">{displayPrice}</p>
            </div>
          </div>
        </div>

        {/* Tags */}
        {place.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {place.tags.map((tag) => (
              <Badge key={tag} variant="default" className="bg-primary-50 text-primary-600">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Review Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-neutral-900">Recent Reviews</h4>
          <div className="space-y-3">
            {mockReviews.map((review, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-neutral-50 border border-neutral-100"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-600">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-neutral-800">
                      {review.author}
                    </span>
                  </div>
                  <RatingStars rating={review.rating} size="sm" />
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
          <button
            onClick={() => onSave?.(place.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              place.isSaved
                ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${place.isSaved ? 'fill-current' : ''}`} />
            {place.isSaved ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={() => onAddToItinerary?.(place.id)}
            disabled={isAddingToItinerary}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CalendarPlus className="w-4 h-4" />
            {isAddingToItinerary ? 'Adding...' : 'Add to Itinerary'}
          </button>

          {visitUrl && (
            <a
              href={visitUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors ml-auto"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Site
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PlaceDetailModal;
