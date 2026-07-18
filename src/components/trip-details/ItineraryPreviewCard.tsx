import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { ItineraryDay } from '../../types';
import { allItineraryItems } from '../../utils/tripExport';
import { formatDayDate } from '../../utils/tripDisplay';
import Card from '../ui/Card';
import IconChip from '../ui/IconChip';
import SectionHeader from '../ui/SectionHeader';

interface ItineraryPreviewCardProps {
  tripId: string;
  itinerary: ItineraryDay[];
}

const PREVIEW_DAYS = 3;
const PREVIEW_ITEMS = 4;

const ItineraryPreviewCard: React.FC<ItineraryPreviewCardProps> = ({ tripId, itinerary }) => {
  const previewDays = itinerary.slice(0, PREVIEW_DAYS);

  return (
    <Card hover={false} className="p-5">
      <SectionHeader
        title="Itinerary"
        meta={
          itinerary.length > 0
            ? `${itinerary.length} day${itinerary.length === 1 ? '' : 's'}`
            : undefined
        }
        action={
          <Link
            to={`/trip/${tripId}/itinerary`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            Open itinerary
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      {previewDays.length > 0 ? (
        <div className="space-y-4">
          {previewDays.map((day) => {
            const items = allItineraryItems(day);
            return (
              <div key={day.dayNumber}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {day.dayNumber}
                  </span>
                  <p className="text-sm font-semibold text-app-text">Day {day.dayNumber}</p>
                  <p className="text-xs text-app-text-subtle">{formatDayDate(day.date)}</p>
                </div>
                <div className="ml-4 mt-2 space-y-1 border-l-2 border-app-border-muted pl-6">
                  {items.slice(0, PREVIEW_ITEMS).map((item, idx) => (
                    <p key={item.id || idx} className="flex items-baseline gap-2 text-sm">
                      <span className="w-12 shrink-0 text-xs tabular-nums text-app-text-subtle">
                        {item.time || '—'}
                      </span>
                      <span className="truncate text-app-text">{item.name}</span>
                    </p>
                  ))}
                  {items.length > PREVIEW_ITEMS && (
                    <p className="text-xs text-app-text-subtle">
                      +{items.length - PREVIEW_ITEMS} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {itinerary.length > PREVIEW_DAYS && (
            <p className="text-xs text-app-text-subtle">
              +{itinerary.length - PREVIEW_DAYS} more days
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <IconChip tone="neutral" icon={<CalendarDays className="h-4 w-4" />} />
          <p className="text-sm text-app-text-muted">No itinerary planned yet</p>
          <Link
            to={`/trip/${tripId}/itinerary`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Start planning →
          </Link>
        </div>
      )}
    </Card>
  );
};

export default ItineraryPreviewCard;
