import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, MapPin, Pencil, Users, Wallet } from 'lucide-react';
import type { Trip } from '../../types';
import { formatDateRange, getDaysUntil } from '../../utils/tripDisplay';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import Pill from '../ui/Pill';
import ProgressBar from '../ui/ProgressBar';

interface TripHeroCardProps {
  trip: Trip;
  tripName: string;
  locationLabel: string;
  nextStepRoute: string;
}

const TripHeroCard: React.FC<TripHeroCardProps> = ({
  trip,
  tripName,
  locationLabel,
  nextStepRoute,
}) => {
  const days = getDaysUntil(trip.startDate);
  const countdown =
    days === null
      ? 'Dates TBD'
      : days < 0
        ? trip.status === 'past'
          ? 'Trip complete'
          : 'In progress'
        : days === 0
          ? 'Departs today'
          : `${days} day${days === 1 ? '' : 's'} to go`;

  return (
    <Card hover={false} className="sm:grid sm:grid-cols-[260px_minmax(0,1fr)]">
      <ImagePlaceholder
        src={trip.image}
        alt={tripName}
        aspectRatio="video"
        className="h-full min-h-52 sm:aspect-auto"
        fallbackText={tripName}
      />
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary-600">
          Trip overview
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-display text-2xl font-semibold text-app-text-strong sm:text-[1.75rem]">
            {tripName}
          </h1>
          <Badge variant={trip.status}>{trip.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-app-text-muted">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-app-text-subtle" />
            {locationLabel}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-app-text-subtle" />
            {formatDateRange(trip.startDate, trip.endDate)}
          </span>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-app-text-subtle" />
            {trip.travelers} traveler{trip.travelers === 1 ? '' : 's'}
          </span>
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-app-text-subtle" />
            ${trip.budget.toLocaleString()} budget
          </span>
        </div>
        <Pill
          tone={days === null || days < 0 ? 'neutral' : 'primary'}
          icon={<Clock className="h-4 w-4" />}
        >
          {countdown}
        </Pill>
        <div>
          <div className="mb-1 flex justify-between text-xs text-app-text-muted">
            <span>Planning progress</span>
            <span>{trip.planningProgress}%</span>
          </div>
          <ProgressBar value={trip.planningProgress} size="sm" />
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Link to={`/trip/${trip.id}/${nextStepRoute}`}>
            <Button size="sm">
              Continue planning
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/trip/${trip.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit trip
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default TripHeroCard;
