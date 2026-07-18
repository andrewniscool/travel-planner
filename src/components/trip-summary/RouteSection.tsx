import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import type { TransportSegment, TripStop } from '../../types';
import { formatLongDate } from '../../utils/tripDisplay';
import DossierSection from './DossierSection';

interface RouteSectionProps {
  stops: TripStop[];
  segments: TransportSegment[];
  getStopName: (stopId?: string) => string | undefined;
}

const RouteSection: React.FC<RouteSectionProps> = ({ stops, segments, getStopName }) => {
  const linkedSegments = segments.filter((segment) => segment.fromStopId && segment.toStopId);

  return (
    <DossierSection icon={<MapPin className="h-4 w-4" />} title="Route" meta={`${stops.length} stops`}>
      <ol>
        {stops.map((stop, index) => (
          <li key={stop.id} className="relative flex gap-3 pb-4 last:pb-0">
            {index < stops.length - 1 && (
              <span className="absolute bottom-0 left-[15px] top-8 w-px bg-app-border-muted" />
            )}
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
              {stop.order}
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm font-semibold text-app-text-strong">
                {stop.name}
                {stop.country ? `, ${stop.country}` : ''}
              </p>
              <p className="text-xs text-app-text-muted">
                {formatLongDate(stop.startDate)} – {formatLongDate(stop.endDate)}
              </p>
            </div>
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
    </DossierSection>
  );
};

export default RouteSection;
