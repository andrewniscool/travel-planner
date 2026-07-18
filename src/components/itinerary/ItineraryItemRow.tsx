import React from 'react';
import {
  Building2,
  Car,
  Coffee,
  DollarSign,
  MapPin,
  Pencil,
  Plane,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { GOOGLE_HOTEL_IMAGE, GOOGLE_PLACE_IMAGE } from '../../services/locationDisplayMappers';
import type { ItineraryItem, ItineraryItemType } from '../../types';

const typeIconMap: Record<ItineraryItemType, React.ReactNode> = {
  flight: <Plane className="w-4 h-4" />,
  hotel: <Building2 className="w-4 h-4" />,
  restaurant: <UtensilsCrossed className="w-4 h-4" />,
  activity: <MapPin className="w-4 h-4" />,
  'free-time': <Coffee className="w-4 h-4" />,
  transport: <Car className="w-4 h-4" />,
};

const typeColorMap: Record<ItineraryItemType, string> = {
  flight: 'bg-accent-100 text-accent-700',
  hotel: 'bg-primary-50 text-primary-700',
  restaurant: 'bg-warning-50 text-warning-600',
  activity: 'bg-success-50 text-success-600',
  'free-time': 'bg-neutral-100 text-neutral-600',
  transport: 'bg-accent-50 text-accent-600',
};

const getItineraryItemImage = (item: ItineraryItem) => {
  const googlePhoto = item.locationRef?.photoUrls?.[0];
  if (googlePhoto) return googlePhoto;
  if (item.locationRef?.source !== 'google') return undefined;
  return item.type === 'hotel' ? GOOGLE_HOTEL_IMAGE : GOOGLE_PLACE_IMAGE;
};

interface ItineraryItemRowProps {
  item: ItineraryItem;
  onEdit: (item: ItineraryItem) => void;
  onRemove: (id: string) => void;
}

const ItineraryItemRow: React.FC<ItineraryItemRowProps> = ({ item, onEdit, onRemove }) => {
  const iconBg = typeColorMap[item.type] || 'bg-neutral-100 text-neutral-600';
  const image = getItineraryItemImage(item);

  return (
    <div className="group flex items-start gap-3 rounded-xl border border-app-border-muted bg-app-surface p-3 transition-all duration-150 hover:border-app-border hover:shadow-card">
      {image ? (
        <img
          src={image}
          alt={item.name}
          loading="lazy"
          decoding="async"
          width={40}
          height={40}
          className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
          onError={(event) => {
            const fallbackImage = item.type === 'hotel' ? GOOGLE_HOTEL_IMAGE : GOOGLE_PLACE_IMAGE;
            if (event.currentTarget.src !== fallbackImage) {
              event.currentTarget.src = fallbackImage;
            }
          }}
        />
      ) : (
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${iconBg}`}
        >
          {typeIconMap[item.type] || <MapPin className="w-4 h-4" />}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-primary-700">{item.time}</span>
          <span className="text-sm font-semibold text-app-text-strong truncate">{item.name}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-app-text-muted">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {item.location}
          </span>
          {item.estimatedCost > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />${item.estimatedCost}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="text-xs text-app-text-subtle mt-1 line-clamp-1">{item.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          aria-label={`Edit ${item.name}`}
          className="p-1.5 rounded-lg text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
          className="p-1.5 rounded-lg text-app-text-subtle hover:bg-error-50 hover:text-error-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ItineraryItemRow;
