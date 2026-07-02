import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, DollarSign, MapPin, Pencil } from 'lucide-react';
import Badge from '../ui/Badge';
import { getSafeImageUrl } from '../../utils/safeUrl';
import type { TripStatus } from '../../types';

const statusVariant: Record<TripStatus, 'upcoming' | 'planning' | 'booked' | 'past'> = {
  upcoming: 'upcoming',
  planning: 'planning',
  booked: 'booked',
  past: 'past',
};

interface TripHeroProps {
  tripId: string;
  image: string;
  tripName: string;
  routeLabel: string;
  dateLabel: string;
  travelers: number;
  budget: number;
  status: TripStatus;
}

const TripHero: React.FC<TripHeroProps> = ({
  tripId,
  image,
  tripName,
  routeLabel,
  dateLabel,
  travelers,
  budget,
  status,
}) => {
  const safeImageUrl = getSafeImageUrl(image);

  return (
    <div className="relative w-full h-64 sm:h-72 md:h-80">
      {safeImageUrl ? (
        <img src={safeImageUrl} alt={tripName} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-gradient-to-br from-neutral-300 to-neutral-500" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

    <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
      <Link
        to={`/trip/${tripId}/edit`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/30 text-white text-sm font-medium bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Edit Trip
      </Link>
    </div>

    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
          {tripName}
        </h1>
        <p className="text-white/80 text-sm mb-3">{routeLabel}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" />
            {dateLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {travelers} traveler{travelers !== 1 ? 's' : ''}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            ${budget.toLocaleString()}
          </span>
          <Badge variant={statusVariant[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </div>
    </div>
    </div>
  );
};

export default TripHero;
