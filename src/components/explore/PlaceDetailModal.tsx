import React from 'react';
import { Bookmark, CalendarPlus, Clock, DollarSign, ExternalLink, MapPin } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import PhotoGallery from '../ui/PhotoGallery';
import RatingStars from '../ui/RatingStars';
import Sheet from '../ui/Sheet';
import { GOOGLE_PLACE_IMAGE } from '../../services/locationDisplayMappers';
import { getSafeExternalUrl } from '../../utils/safeUrl';
import type { Place } from '../../types';

interface PlaceDetailModalProps {
  place: Place | null; isOpen: boolean; onClose: () => void;
  onSave?: (placeId: string) => void; onAddToItinerary?: (placeId: string) => void;
  isAddingToItinerary?: boolean;
}

const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ place, isOpen, onClose, onSave, onAddToItinerary, isAddingToItinerary = false }) => {
  if (!place) return null;
  const name = place.locationRef?.displayName || place.name;
  const photos = place.locationRef?.photoUrls?.length ? place.locationRef.photoUrls : place.image ? [place.image] : [];
  const rating = place.locationRef?.rating ?? place.rating;
  const reviewCount = place.locationRef?.reviewCount ?? place.reviewCount;
  const location = place.locationRef?.formattedAddress || place.location;
  const price = place.locationRef?.priceRange || place.priceRange;
  const safeVisitUrl = getSafeExternalUrl(place.locationRef?.websiteUri || place.locationRef?.googleMapsUri);

  return (
    <Sheet
      isOpen={isOpen} onClose={onClose} title={name} description={place.category}
      closeOnBackdrop={!isAddingToItinerary} closeOnEscape={!isAddingToItinerary}
      footer={<div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <Button variant={place.isSaved ? 'secondary' : 'outline'} onClick={() => onSave?.(place.id)}><Bookmark className={`mr-2 h-4 w-4 ${place.isSaved ? 'fill-current' : ''}`} />{place.isSaved ? 'Saved' : 'Save'}</Button>
        <Button className="flex-1" onClick={() => onAddToItinerary?.(place.id)} disabled={isAddingToItinerary}><CalendarPlus className="mr-2 h-4 w-4" />{isAddingToItinerary ? 'Adding…' : 'Add to itinerary'}</Button>
        {safeVisitUrl && <a href={safeVisitUrl} target="_blank" rel="noopener noreferrer" aria-label="Open place website" className="inline-flex rounded-xl border border-app-border p-2 text-app-text-muted hover:bg-app-surface-muted"><ExternalLink className="h-5 w-5" /></a>}
      </div>}
    >
      <PhotoGallery photos={photos} fallbackPhoto={GOOGLE_PLACE_IMAGE} alt={name} />
      <div className="space-y-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3"><RatingStars rating={rating} size="sm" showCount count={reviewCount} />{place.locationRef?.source === 'google' && <Badge variant="success">Google</Badge>}</div>
        {place.description ? <p className="text-sm leading-6 text-app-text-muted">{place.description}</p> : <p className="rounded-xl bg-app-surface-muted p-4 text-sm text-app-text-muted">No description is available. Visit the provider page for current details.</p>}
        <div className="space-y-3 rounded-2xl border border-app-border-muted p-4">
          <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" /><div><p className="text-xs font-medium text-app-text-subtle">Location</p><p className="text-sm text-app-text">{location}</p></div></div>
          <div className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" /><div><p className="text-xs font-medium text-app-text-subtle">Hours</p><p className="text-sm text-app-text">{place.hours || 'Check the provider for current hours'}</p></div></div>
          <div className="flex gap-3"><DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" /><div><p className="text-xs font-medium text-app-text-subtle">Price range</p><p className="text-sm text-app-text">{price || 'Not available'}</p></div></div>
        </div>
        {place.tags.length > 0 && <div><h3 className="mb-3 text-sm font-semibold text-app-text-strong">Good to know</h3><div className="flex flex-wrap gap-2">{place.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div></div>}
      </div>
    </Sheet>
  );
};

export default PlaceDetailModal;
