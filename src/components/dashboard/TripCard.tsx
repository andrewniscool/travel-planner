import React from 'react';
import { Calendar, Trash2, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getTripDisplayName } from '../../data/trips';
import type { Trip } from '../../types';
import { formatDateRange, getTripLocationLabel } from '../../utils/tripDisplay';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import ImagePlaceholder from '../ui/ImagePlaceholder';
import OverflowMenu from '../ui/OverflowMenu';
import PriceTag from '../ui/PriceTag';
import ProgressBar from '../ui/ProgressBar';

interface Props {
  trip: Trip;
  canDelete: boolean;
  onDelete: (id: string, name: string) => void;
}

const TripCard: React.FC<Props> = ({ trip, canDelete, onDelete }) => {
  const navigate = useNavigate();
  const name = getTripDisplayName(trip);
  const menuItems = [
    { label: 'View trip', onSelect: () => navigate(`/trip/${trip.id}`) },
    ...(canDelete
      ? [
          {
            label: 'Delete',
            icon: <Trash2 className="h-4 w-4" />,
            variant: 'danger' as const,
            onSelect: () => onDelete(trip.id, name),
          },
        ]
      : []),
  ];

  return (
    <Card className="group relative flex flex-col overflow-visible">
      <Link to={`/trip/${trip.id}`} aria-label={`View ${name}`} className="absolute inset-0 z-0" />
      <div className="relative overflow-hidden rounded-t-2xl">
        <ImagePlaceholder src={trip.image} alt={name} aspectRatio="video" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <Badge variant={trip.status} className="absolute left-2.5 top-2.5">
          {trip.status}
        </Badge>
        <div className="pointer-events-none absolute bottom-0 p-3">
          <h3 className="line-clamp-1 text-base font-semibold text-white">{name}</h3>
          <p className="line-clamp-1 text-xs text-white/80">{getTripLocationLabel(trip)}</p>
        </div>
      </div>

      <div className="space-y-2 p-3.5">
        <div className="flex items-center justify-between gap-2 text-xs text-app-text-muted">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {formatDateRange(trip.startDate, trip.endDate)}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {trip.travelers}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PriceTag
            amount={trip.budget}
            currency={trip.budgetCurrency}
            size="sm"
            className="text-app-text-strong"
          />
          <span className="ml-auto text-xs text-app-text-muted">{trip.planningProgress}%</span>
        </div>
        <ProgressBar value={trip.planningProgress} size="sm" />
      </div>
      <OverflowMenu
        className="!absolute right-3 top-3 z-20"
        buttonClassName="bg-app-surface text-app-text-muted shadow-sm ring-1 ring-app-border-muted hover:bg-app-surface-muted"
        items={menuItems}
      />
    </Card>
  );
};

export default TripCard;
