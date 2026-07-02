import React from 'react';
import { Calendar, Users, Wallet } from 'lucide-react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import type { Trip } from '../../types';

const statusBadgeVariant: Record<string, 'upcoming' | 'planning' | 'booked' | 'past'> = {
  upcoming: 'upcoming',
  planning: 'planning',
  booked: 'booked',
  past: 'past',
};

interface TripSummaryHeaderProps {
  trip: Trip;
  tripName: string;
  tripRoute: string;
  formatDate: (date: string) => string;
}

const TripSummaryHeader: React.FC<TripSummaryHeaderProps> = ({
  trip,
  tripName,
  tripRoute,
  formatDate,
}) => (
  <Card hover={false} className="p-6">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
          {tripName}
        </h1>
        <p className="text-neutral-500 mt-1">{tripRoute}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={statusBadgeVariant[trip.status] || 'default'}>
          {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
        </Badge>
        <Badge variant="default">{trip.vibe}</Badge>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-neutral-600">
      <span className="flex items-center gap-1.5">
        <Calendar className="w-4 h-4 text-neutral-400" />
        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
      </span>
      <span className="flex items-center gap-1.5">
        <Users className="w-4 h-4 text-neutral-400" />
        {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}
      </span>
      <span className="flex items-center gap-1.5">
        <Wallet className="w-4 h-4 text-neutral-400" />
        ${trip.budget.toLocaleString()} budget
      </span>
    </div>

    <div className="mt-4 pt-4 border-t border-neutral-100" />
  </Card>
);

export default TripSummaryHeader;
