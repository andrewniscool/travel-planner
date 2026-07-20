import React from 'react';
import { Car, MapPin, Plus } from 'lucide-react';
import ItineraryItemRow from './ItineraryItemRow';
import LocalTransportRow from '../plan/LocalTransportRow';
import StayCard from '../plan/StayCard';
import TransportTransitionCard from '../plan/TransportTransitionCard';
import TravelArrivalMarker from '../plan/TravelArrivalMarker';
import type { PlanTimelineEntry } from '../../utils/planTimeline';
import type { BudgetCurrency, Hotel, ItineraryDay, ItineraryItem, TimeOfDay, TransportSegment, TripStop } from '../../types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

interface DaySectionProps {
  day: ItineraryDay;
  stop?: TripStop;
  showStopLabel: boolean;
  isTravelDay: boolean;
  currency?: BudgetCurrency;
  entries: PlanTimelineEntry[];
  onAddItem: (dayNumber: number, timeOfDay: TimeOfDay) => void;
  onEditItem: (item: ItineraryItem) => void;
  onRemoveItem: (itemId: string) => void;
  onEditTransport: (segment: TransportSegment) => void;
  onDeleteTransport: (segment: TransportSegment) => void;
  onEditStay: (hotel: Hotel) => void;
  onDeleteStay: (hotel: Hotel) => void;
}

const DaySection: React.FC<DaySectionProps> = ({
  day,
  stop,
  showStopLabel,
  isTravelDay,
  currency,
  entries,
  onAddItem,
  onEditItem,
  onRemoveItem,
  onEditTransport,
  onDeleteTransport,
  onEditStay,
  onDeleteStay,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-base font-semibold text-primary-700">
          {day.dayNumber}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-app-text-strong">Day {day.dayNumber}</h2>
            {showStopLabel && stop && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
                <MapPin className="w-3 h-3" />
                {stop.name}
              </span>
            )}
            {isTravelDay && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
                <Car className="w-3 h-3" />
                Travel day
              </span>
            )}
          </div>
          <p className="text-sm text-app-text-muted">
            {formatDate(day.date)}
            {showStopLabel && stop?.country ? ` · ${stop.country}` : ''}
          </p>
        </div>
      </div>

      <div className="ml-5 space-y-2 border-l-2 border-app-border-muted pl-4 sm:ml-6 sm:pl-6">
        {entries.map((entry) => {
          if (entry.kind === 'itinerary') return <ItineraryItemRow key={entry.id} item={entry.item} onEdit={onEditItem} onRemove={onRemoveItem} />;
          if (entry.kind === 'stay') return <StayCard key={entry.id} hotel={entry.hotel} currency={currency} onEdit={onEditStay} onDelete={onDeleteStay} />;
          if (entry.kind === 'travel-arrival') return <TravelArrivalMarker key={entry.id} segment={entry.segment} />;
          return entry.prominent
            ? <TransportTransitionCard key={entry.id} segment={entry.segment} onEdit={onEditTransport} onDelete={onDeleteTransport} />
            : <LocalTransportRow key={entry.id} segment={entry.segment} onEdit={onEditTransport} onDelete={onDeleteTransport} />;
        })}
        {entries.length === 0 && <p className="rounded-xl border border-dashed border-app-border bg-app-surface-subtle p-4 text-sm text-app-text-subtle">Nothing scheduled yet.</p>}
        <button
          type="button"
          onClick={() => onAddItem(day.dayNumber, 'morning')}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
        >
          <Plus className="h-3.5 w-3.5" /> Add item
        </button>
      </div>
    </div>
  );
};

export default DaySection;
