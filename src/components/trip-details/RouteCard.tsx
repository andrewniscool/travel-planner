import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { TransportSegment, TripStop } from '../../types';
import { formatDateRange } from '../../utils/tripDisplay';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';

interface RouteCardProps {
  stops: TripStop[];
  segments: TransportSegment[];
  getStopName: (stopId?: string) => string | undefined;
}

const RouteCard: React.FC<RouteCardProps> = ({ stops, segments, getStopName }) => {
  const linkedSegments = segments.filter((segment) => segment.fromStopId && segment.toStopId);

  return (
    <Card hover={false} className="p-5">
      <SectionHeader title="Route" meta={`${stops.length} stops`} />
      <ol className="space-y-1">
        {stops.map((stop) => (
          <li key={stop.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {stop.order}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-app-text">
                {stop.name}
                {stop.country ? `, ${stop.country}` : ''}
              </p>
            </div>
            <span className="shrink-0 text-xs text-app-text-muted">
              {formatDateRange(stop.startDate, stop.endDate)}
            </span>
          </li>
        ))}
      </ol>
      {linkedSegments.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-app-border-muted pt-3">
          {linkedSegments.map((segment) => (
            <p key={segment.id} className="flex items-center gap-2 text-xs text-app-text-muted">
              <ArrowRight className="h-3.5 w-3.5 text-app-text-subtle" />
              {getStopName(segment.fromStopId)} → {getStopName(segment.toStopId)}
              <span className="text-app-text-subtle">· {segment.provider || segment.mode}</span>
            </p>
          ))}
        </div>
      )}
    </Card>
  );
};

export default RouteCard;
