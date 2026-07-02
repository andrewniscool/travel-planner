import React from 'react';
import { Check, ExternalLink, MapPin } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import PhotoGallery from '../ui/PhotoGallery';
import RatingStars from '../ui/RatingStars';
import { GOOGLE_HOTEL_IMAGE } from '../../services/locationDisplayMappers';
import { getSafeExternalUrl } from '../../utils/safeUrl';
import type { Hotel } from '../../types';
import {
  amenityIcons,
  getGoogleRating,
  getGoogleReviewCount,
  getLocationLabel,
  mockReviews,
} from './hotelDisplay';

interface HotelDetailModalProps {
  hotel: Hotel | null;
  isOpen: boolean;
  isSelected: boolean;
  onClose: () => void;
  onSelect: () => void;
}

const HotelDetailModal: React.FC<HotelDetailModalProps> = ({
  hotel,
  isOpen,
  isSelected,
  onClose,
  onSelect,
}) => {
  if (!hotel) return null;

  const hotelPhotos = hotel.locationRef?.photoUrls?.length
    ? hotel.locationRef.photoUrls
    : [hotel.image];
  const safeWebsiteUrl = getSafeExternalUrl(hotel.locationRef?.websiteUri);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={hotel.locationRef?.displayName || hotel.name} size="lg">
      <div className="space-y-6">
        <div className="rounded-xl overflow-hidden">
          <PhotoGallery
            photos={hotelPhotos}
            fallbackPhoto={GOOGLE_HOTEL_IMAGE}
            alt={hotel.name}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <RatingStars rating={getGoogleRating(hotel)} />
          <span className="text-sm text-neutral-500">
            ({getGoogleReviewCount(hotel).toLocaleString()} reviews)
          </span>
          <Badge variant="default">Google Places-ready</Badge>
        </div>

        <p className="text-sm text-neutral-700 leading-relaxed">{hotel.description}</p>

        <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm text-neutral-600">
            <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
            <span>{getLocationLabel(hotel)}</span>
          </div>
          <p className="text-sm text-neutral-500">{hotel.distanceToCenter}</p>
          {hotel.locationRef?.nationalPhoneNumber && (
            <p className="text-sm text-neutral-500">{hotel.locationRef.nationalPhoneNumber}</p>
          )}
          {safeWebsiteUrl && (
            <a
              href={safeWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Website
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-900 mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-700"
              >
                {amenityIcons[amenity] || null}
                {amenity}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-neutral-900 mb-3">Review Highlights</h4>
          <div className="space-y-3">
            {mockReviews.map((review) => (
              <div key={review.author} className="bg-neutral-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-neutral-900">{review.author}</span>
                  <RatingStars rating={review.rating} size="sm" />
                </div>
                <p className="text-sm text-neutral-600">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        <Button variant={isSelected ? 'secondary' : 'primary'} size="lg" className="w-full" onClick={onSelect}>
          <Check className="w-4 h-4 mr-2" />
          {isSelected ? 'Selected' : 'Select Hotel'}
        </Button>
      </div>
    </Modal>
  );
};

export default HotelDetailModal;
