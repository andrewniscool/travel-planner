import React from 'react';
import { MapPin } from 'lucide-react';
import Card from '../ui/Card';
import type { TransportSegment, TripStop } from '../../types';

interface SummaryRouteCardProps {
  stops: TripStop[];
  transportSegments: TransportSegment[];
  formatDate: (date: string) => string;
  getStopName: (stopId?: string) => string | undefined;
}

const SummaryRouteCard: React.FC<SummaryRouteCardProps> = ({
  stops,
  transportSegments,
  formatDate,
  getStopName,
}) => (
  <Card hover={false} className="p-6">
    <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
      <MapPin className="w-5 h-5 text-primary-500" />
      Route
    </h2>
    <div className="space-y-4">
      {stops.map((stop) => (
        <div key={stop.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold">
            {stop.order}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-800">{stop.name}</p>
            <p className="text-xs text-neutral-500">
              {formatDate(stop.startDate)} - {formatDate(stop.endDate)}
            </p>
          </div>
        </div>
      ))}
      {transportSegments.length > 0 && (
        <div className="pt-2 border-t border-neutral-100 space-y-2">
          {transportSegments.map((segment) => (
            <div key={segment.id} className="text-sm text-neutral-600">
              {getStopName(segment.fromStopId)} → {getStopName(segment.toStopId)}
              <span className="text-neutral-400"> · {segment.provider || segment.mode}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </Card>
);

export default SummaryRouteCard;
