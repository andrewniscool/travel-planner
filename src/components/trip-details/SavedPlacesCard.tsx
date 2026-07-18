import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import type { Place } from '../../types';
import Card from '../ui/Card';
import IconChip from '../ui/IconChip';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import SectionHeader from '../ui/SectionHeader';

interface SavedPlacesCardProps {
  tripId: string;
  places: Place[];
}

const SavedPlacesCard: React.FC<SavedPlacesCardProps> = ({ tripId, places }) => {
  const displayPlaces = places.slice(0, 4);

  return (
    <Card hover={false} className="p-5">
      <SectionHeader
        title="Saved places"
        meta={places.length ? String(places.length) : undefined}
        action={
          <Link
            to={`/trip/${tripId}/explore`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            Explore
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      {displayPlaces.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {displayPlaces.map((place) => (
            <div key={place.id} className="relative overflow-hidden rounded-xl">
              <ImagePlaceholder
                src={place.image}
                alt={place.name}
                aspectRatio="square"
                fallbackText={place.name}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className="truncate text-xs font-semibold text-white">{place.name}</p>
                <p className="text-[10px] text-white/80">{place.category}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <IconChip tone="neutral" icon={<MapPin className="h-4 w-4" />} />
          <p className="text-sm text-app-text-muted">No places saved yet</p>
          <Link
            to={`/trip/${tripId}/explore`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Explore places →
          </Link>
        </div>
      )}
    </Card>
  );
};

export default SavedPlacesCard;
