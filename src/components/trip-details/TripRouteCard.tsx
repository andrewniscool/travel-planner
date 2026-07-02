import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { TripStop } from '../../types';

interface TripRouteCardProps {
  stops: TripStop[];
  isMultiStop: boolean;
  routeLabel: string;
  formatDate: (date: string) => string;
}

const TripRouteCard: React.FC<TripRouteCardProps> = ({
  stops,
  isMultiStop,
  routeLabel,
  formatDate,
}) => {
  if (stops.length === 0) return null;

  const firstStop = stops[0];

  return (
    <Card hover={false} className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            {isMultiStop ? 'Trip Route' : 'Destination'}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {isMultiStop
              ? routeLabel
              : `${firstStop.name}${firstStop.country ? `, ${firstStop.country}` : ''}`}
          </p>
        </div>
        {isMultiStop && <Badge variant="default">{stops.length} stops</Badge>}
      </div>

      <div className={isMultiStop ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4' : 'max-w-md'}>
        {stops.map((stop, index) => (
          <div
            key={stop.id}
            className="relative rounded-xl border border-neutral-100 bg-neutral-50 p-4"
          >
            {isMultiStop && index < stops.length - 1 && (
              <div className="hidden xl:block absolute top-8 left-full w-4 h-px bg-neutral-200" />
            )}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold shrink-0">
                {stop.order}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-900">
                  {stop.name}
                </h3>
                {stop.country && (
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {stop.country}
                  </p>
                )}
                <p className="text-xs text-neutral-500 mt-2">
                  {formatDate(stop.startDate)} - {formatDate(stop.endDate)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TripRouteCard;
