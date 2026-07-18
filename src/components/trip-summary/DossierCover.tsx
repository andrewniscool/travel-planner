import React from 'react';
import { Calendar, Sparkles, Users, Wallet } from 'lucide-react';
import type { Trip } from '../../types';
import { formatLongDate } from '../../utils/tripDisplay';
import Badge from '../ui/Badge';
import ImagePlaceholder from '../ui/ImagePlaceholder';

interface DossierCoverProps {
  trip: Trip;
  tripName: string;
  locationLabel: string;
}

const DossierCover: React.FC<DossierCoverProps> = ({ trip, tripName, locationLabel }) => {
  return (
    <div>
      <div className="relative">
        <ImagePlaceholder src={trip.image} alt={tripName} aspectRatio="wide" fallbackText={tripName} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-2 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-eyebrow text-white/80">
              Trip dossier
            </p>
            <p className="mt-1 text-lg font-semibold text-white">{tripName}</p>
            <p className="text-sm text-white/85">{locationLabel}</p>
          </div>
          <Badge variant={trip.status}>{trip.status}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-b border-app-border-muted px-6 py-4 text-sm text-app-text-muted sm:px-7">
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-app-text-subtle" />
          {formatLongDate(trip.startDate)} – {formatLongDate(trip.endDate)}
        </span>
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 text-app-text-subtle" />
          {trip.travelers} traveler{trip.travelers === 1 ? '' : 's'}
        </span>
        <span className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-app-text-subtle" />
          ${trip.budget.toLocaleString()} budget
        </span>
        {trip.vibe && (
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-app-text-subtle" />
            {trip.vibe}
          </span>
        )}
      </div>
    </div>
  );
};

export default DossierCover;
