import React from 'react';
import { Car, MapPin, Moon, Plus, Sun, Sunrise } from 'lucide-react';
import ItineraryItemRow from './ItineraryItemRow';
import type { ItineraryDay, ItineraryItem, TimeOfDay, TripStop } from '../../types';

const timeOfDayConfig: Record<TimeOfDay, { label: string; icon: React.ReactNode; color: string }> =
  {
    morning: {
      label: 'Morning',
      icon: <Sunrise className="w-4 h-4" />,
      color: 'text-warning-500',
    },
    afternoon: {
      label: 'Afternoon',
      icon: <Sun className="w-4 h-4" />,
      color: 'text-primary-500',
    },
    evening: {
      label: 'Evening',
      icon: <Moon className="w-4 h-4" />,
      color: 'text-accent-500',
    },
  };

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
  itemsMap: Record<string, ItineraryItem[]>;
  onAddItem: (dayNumber: number, timeOfDay: TimeOfDay) => void;
  onEditItem: (item: ItineraryItem) => void;
  onRemoveItem: (itemId: string) => void;
}

const DaySection: React.FC<DaySectionProps> = ({
  day,
  stop,
  showStopLabel,
  isTravelDay,
  itemsMap,
  onAddItem,
  onEditItem,
  onRemoveItem,
}) => {
  const timeSections: TimeOfDay[] = ['morning', 'afternoon', 'evening'];

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

      <div className="ml-5 pl-4 sm:ml-6 sm:pl-6 border-l-2 border-app-border-muted space-y-5">
        {timeSections.map((timeOfDay) => {
          const config = timeOfDayConfig[timeOfDay];
          const sectionKey = `${day.dayNumber}-${timeOfDay}`;
          const items = itemsMap[sectionKey] || [];

          return (
            <div key={timeOfDay} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className={config.color}>{config.icon}</span>
                <h3 className="text-sm font-semibold text-app-text">{config.label}</h3>
                {items.length > 0 && (
                  <span className="text-xs text-app-text-subtle">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((item) => (
                    <ItineraryItemRow
                      key={item.id}
                      item={item}
                      onEdit={onEditItem}
                      onRemove={onRemoveItem}
                    />
                  ))}
                  <button
                    onClick={() => onAddItem(day.dayNumber, timeOfDay)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-app-text-subtle hover:text-primary-700 hover:bg-primary-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-app-border bg-app-surface-subtle">
                  <p className="text-sm text-app-text-subtle">No activities planned</p>
                  <button
                    onClick={() => onAddItem(day.dayNumber, timeOfDay)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DaySection;
