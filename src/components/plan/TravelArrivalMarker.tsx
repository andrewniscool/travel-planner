import React from 'react';
import { MapPin } from 'lucide-react';
import { formatLocalDateTime } from '../../utils/planTimeline';
import type { TransportSegment } from '../../types';

const TravelArrivalMarker: React.FC<{ segment: TransportSegment }> = ({ segment }) => (
  <a href={`#travel-${segment.id}`} className="flex items-center gap-3 rounded-xl border border-dashed border-accent-200 bg-accent-50/40 px-3 py-2 text-sm">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700"><MapPin className="h-4 w-4" /></span>
    <span className="min-w-0"><strong className="block truncate text-app-text-strong">Arrives in {segment.arrivalLocation || 'destination'}</strong><span className="text-xs text-app-text-muted">{formatLocalDateTime(segment.arrivalDateTime) || 'Arrival time not set'} · View travel details</span></span>
  </a>
);

export default TravelArrivalMarker;
