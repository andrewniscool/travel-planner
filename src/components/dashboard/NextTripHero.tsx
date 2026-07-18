import React from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTripDisplayName } from '../../data/trips';
import type { Trip } from '../../types';
import { formatDateRange, getDaysUntil, getTripLocationLabel } from '../../utils/tripDisplay';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import ProgressBar from '../ui/ProgressBar';
const NextTripHero: React.FC<{ trip: Trip }> = ({ trip }) => {
  const days = getDaysUntil(trip.startDate);
  const countdown =
    days === null
      ? 'Dates TBD'
      : days < 0
        ? 'In progress'
        : days === 0
          ? 'Departs today'
          : `${days} day${days === 1 ? '' : 's'} to go`;
  return (
    <Card hover={false} className="sm:grid sm:grid-cols-[220px_minmax(0,1fr)]">
      <ImagePlaceholder
        src={trip.image}
        alt={getTripDisplayName(trip)}
        aspectRatio="video"
        className="h-full min-h-48 object-cover"
      />
      <div className="flex flex-col gap-2.5 p-5">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-primary-600">
          Next trip
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold text-app-text-strong">{getTripDisplayName(trip)}</h2>
          <Badge variant={trip.status}>{trip.status}</Badge>
        </div>
        <div className="space-y-1 text-sm text-app-text-muted">
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {getTripLocationLabel(trip)}
          </p>
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDateRange(trip.startDate, trip.endDate)}
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${days === null ? 'bg-app-surface-muted text-app-text-muted' : 'bg-primary-50 text-primary-700'}`}
        >
          <Clock className="h-4 w-4" />
          {countdown}
        </span>
        <div>
          <div className="mb-1 flex justify-between text-xs text-app-text-muted">
            <span>Planning progress</span>
            <span>{trip.planningProgress}%</span>
          </div>
          <ProgressBar value={trip.planningProgress} size="sm" />
        </div>
        <Link to={`/trip/${trip.id}`} className="mt-auto">
          <Button size="sm">Continue Planning →</Button>
        </Link>
      </div>
    </Card>
  );
};
export default NextTripHero;
