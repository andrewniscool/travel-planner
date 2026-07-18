import React from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import type { ItineraryDay, TripStop } from '../../types';
import { formatDayDate } from '../../utils/tripDisplay';
import { allItineraryItems } from '../../utils/tripExport';
import DossierSection from './DossierSection';

interface ItinerarySectionProps {
  itinerary: ItineraryDay[];
  isMultiStop: boolean;
  getStopForDay: (day: ItineraryDay) => TripStop | undefined;
}

const ItinerarySection: React.FC<ItinerarySectionProps> = ({
  itinerary,
  isMultiStop,
  getStopForDay,
}) => {
  return (
    <DossierSection
      icon={<CalendarDays className="h-4 w-4" />}
      title="Day by day"
      meta={itinerary.length > 0 ? `${itinerary.length} day${itinerary.length === 1 ? '' : 's'}` : undefined}
    >
      {itinerary.length > 0 ? (
        <div className="space-y-5">
          {itinerary.map((day) => {
            const stop = isMultiStop ? getStopForDay(day) : undefined;
            return (
              <div key={day.dayNumber}>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {day.dayNumber}
                  </span>
                  <p className="text-sm font-semibold text-app-text">Day {day.dayNumber}</p>
                  <p className="text-xs text-app-text-subtle">{formatDayDate(day.date)}</p>
                  {stop && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                      <MapPin className="h-3 w-3" />
                      {stop.name}
                    </span>
                  )}
                </div>
                <div className="ml-4 mt-2 space-y-1.5 border-l-2 border-app-border-muted pl-6">
                  {allItineraryItems(day).map((item, idx) => (
                    <p key={item.id || idx} className="flex items-baseline gap-2 text-sm">
                      <span className="w-14 shrink-0 text-xs tabular-nums text-app-text-subtle">
                        {item.time || '—'}
                      </span>
                      <span className="min-w-0 text-app-text">
                        {item.name}
                        {item.location && (
                          <span className="text-app-text-subtle"> · {item.location}</span>
                        )}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-app-text-subtle">No itinerary planned.</p>
      )}
    </DossierSection>
  );
};

export default ItinerarySection;
