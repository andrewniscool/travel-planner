import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Globe2, MapPin, Phone } from 'lucide-react';
import Button from '../ui/Button';
import PhotoGallery from '../ui/PhotoGallery';
import RatingStars from '../ui/RatingStars';
import Sheet from '../ui/Sheet';
import { GOOGLE_HOTEL_IMAGE } from '../../services/locationDisplayMappers';
import { getSafeExternalUrl } from '../../utils/safeUrl';
import type { Hotel } from '../../types';
import { amenityIcons, getGoogleRating, getGoogleReviewCount, getLocationLabel } from './hotelDisplay';

interface HotelDetailModalProps {
  hotel: Hotel | null; isOpen: boolean; isSelected: boolean; onClose: () => void; onSelect: () => void;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const HotelDetailModal: React.FC<HotelDetailModalProps> = ({ hotel, isOpen, isSelected, onClose, onSelect }) => {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  useEffect(() => setShowAllAmenities(false), [hotel?.id]);
  if (!hotel) return null;

  const photos = hotel.locationRef?.photoUrls?.length ? hotel.locationRef.photoUrls : [hotel.image];
  const safeWebsiteUrl = getSafeExternalUrl(hotel.locationRef?.websiteUri);
  const safeMapUrl = getSafeExternalUrl(hotel.locationRef?.googleMapsUri);
  const visibleAmenities = showAllAmenities ? hotel.amenities : hotel.amenities.slice(0, 8);

  return (
    <Sheet
      isOpen={isOpen} onClose={onClose}
      title={hotel.locationRef?.displayName || hotel.name}
      description={getLocationLabel(hotel)}
      footer={<Button variant={isSelected ? 'secondary' : 'primary'} size="lg" className="w-full" onClick={onSelect}><Check className="mr-2 h-4 w-4" />{isSelected ? 'Selected — remove' : 'Select hotel'}</Button>}
    >
      <PhotoGallery photos={photos} fallbackPhoto={GOOGLE_HOTEL_IMAGE} alt={hotel.name} />
      <div className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><RatingStars rating={getGoogleRating(hotel)} size="sm" showCount count={getGoogleReviewCount(hotel)} /></div>
          {(hotel.pricePerNight > 0 || hotel.totalCost > 0) && <div className="text-right">{hotel.pricePerNight > 0 && <p className="text-lg font-semibold text-app-text-strong">{money.format(hotel.pricePerNight)} <span className="text-xs font-normal text-app-text-muted">/ night</span></p>}{hotel.totalCost > 0 && <p className="text-xs text-app-text-muted">{money.format(hotel.totalCost)} total</p>}</div>}
        </div>

        {hotel.description ? <p className="text-sm leading-6 text-app-text-muted">{hotel.description}</p> : <p className="rounded-xl bg-app-surface-muted p-4 text-sm text-app-text-muted">No description is available. Visit the provider page for current details.</p>}

        <section className="space-y-3 rounded-2xl border border-app-border-muted p-4">
          <h3 className="text-sm font-semibold text-app-text-strong">Location and contact</h3>
          <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" /><div><p className="text-sm text-app-text">{getLocationLabel(hotel)}</p>{hotel.distanceToCenter && <p className="mt-0.5 text-xs text-app-text-muted">{hotel.distanceToCenter}</p>}</div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" /><div><p className="text-xs font-medium text-app-text-subtle">Phone</p>{hotel.locationRef?.nationalPhoneNumber ? <a className="text-sm text-primary-700 hover:underline" href={`tel:${hotel.locationRef.nationalPhoneNumber}`}>{hotel.locationRef.nationalPhoneNumber}</a> : <p className="text-sm text-app-text-muted">No phone found</p>}</div></div>
            <div className="flex items-start gap-3"><Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" /><div><p className="text-xs font-medium text-app-text-subtle">Website</p>{safeWebsiteUrl ? <a className="inline-flex items-center gap-1 text-sm text-primary-700 hover:underline" href={safeWebsiteUrl} target="_blank" rel="noopener noreferrer">Visit website <ExternalLink className="h-3.5 w-3.5" /></a> : <p className="text-sm text-app-text-muted">No website found</p>}</div></div>
          </div>
          {safeMapUrl && <a href={safeMapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline">View on map <ExternalLink className="h-3.5 w-3.5" /></a>}
        </section>

        {hotel.amenities.length > 0 && <section><h3 className="mb-3 text-sm font-semibold text-app-text-strong">Amenities</h3><div className="flex flex-wrap gap-2">{visibleAmenities.map((amenity) => <span key={amenity} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700">{amenityIcons[amenity] || null}{amenity}</span>)}</div>{hotel.amenities.length > 8 && <button type="button" onClick={() => setShowAllAmenities((value) => !value)} className="mt-3 text-sm font-medium text-primary-700 hover:underline">{showAllAmenities ? 'Show fewer amenities' : `Show all ${hotel.amenities.length} amenities`}</button>}</section>}
      </div>
    </Sheet>
  );
};

export default HotelDetailModal;
