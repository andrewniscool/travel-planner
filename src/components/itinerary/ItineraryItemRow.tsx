import React from 'react';
import {
  Building2,
  Car,
  Coffee,
  DollarSign,
  GripVertical,
  MapPin,
  Pencil,
  Plane,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  GOOGLE_HOTEL_IMAGE,
  GOOGLE_PLACE_IMAGE,
} from '../../services/locationDisplayMappers';
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
  flight: 'bg-blue-100 text-blue-600',
  hotel: 'bg-purple-100 text-purple-600',
  restaurant: 'bg-orange-100 text-orange-600',
  activity: 'bg-emerald-100 text-emerald-600',
  'free-time': 'bg-amber-100 text-amber-600',
  transport: 'bg-cyan-100 text-cyan-600',
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

const ItineraryItemRow: React.FC<ItineraryItemRowProps> = ({
  item,
  onEdit,
  onRemove,
}) => {
  const iconBg = typeColorMap[item.type] || 'bg-neutral-100 text-neutral-600';
  const image = getItineraryItemImage(item);

  return (
    <div className="group flex items-start gap-3 p-3 rounded-xl bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all duration-150">
      <div className="flex items-center pt-1 text-neutral-300">
        <GripVertical className="w-4 h-4" />
      </div>

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
            const fallbackImage =
              item.type === 'hotel' ? GOOGLE_HOTEL_IMAGE : GOOGLE_PLACE_IMAGE;
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
          <span className="text-sm font-bold text-primary-600">{item.time}</span>
          <span className="text-sm font-semibold text-neutral-900 truncate">
            {item.name}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-500">
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
          <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
            {item.notes}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ItineraryItemRow;
