import React from 'react';
import { Calendar } from 'lucide-react';
import Card from '../ui/Card';
import type { ItineraryDay, ItineraryItem } from '../../types';

interface DailyItinerarySummaryCardProps {
  itinerary: ItineraryDay[];
  formatDayDate: (date: string) => string;
  allItineraryItems: (day: ItineraryDay) => ItineraryItem[];
}

const DailyItinerarySummaryCard: React.FC<DailyItinerarySummaryCardProps> = ({
  itinerary,
  formatDayDate,
  allItineraryItems,
}) => (
  <Card hover={false} className="p-6">
    <h2 className="text-base font-semibold text-neutral-800 flex items-center gap-2 mb-4">
      <Calendar className="w-5 h-5 text-primary-500" />
      Daily Itinerary
    </h2>
    {itinerary.length > 0 ? (
      <div className="space-y-4">
        {itinerary.map((day) => {
          const items = allItineraryItems(day);
          return (
            <div key={day.dayNumber} className="bg-neutral-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-neutral-800 mb-2">
                Day {day.dayNumber} - {formatDayDate(day.date)}
              </h3>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 text-sm text-neutral-600"
                  >
                    <span className="text-neutral-400 font-mono text-xs mt-0.5 shrink-0 w-12">
                      {item.time}
                    </span>
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Calendar className="w-8 h-8 text-neutral-300 mb-2" />
        <p className="text-sm text-neutral-500">No itinerary planned</p>
      </div>
    )}
  </Card>
);

export default DailyItinerarySummaryCard;
