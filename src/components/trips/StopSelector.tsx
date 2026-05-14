import React from 'react';
import { MapPin } from 'lucide-react';
import type { TripStop } from '../../types';

interface StopSelectorProps {
  stops: TripStop[];
  selectedStopId?: string;
  onChange: (stopId: string) => void;
  className?: string;
}

const formatStopLabel = (stop: TripStop) =>
  stop.country ? `${stop.name}, ${stop.country}` : stop.name;

const StopSelector: React.FC<StopSelectorProps> = ({
  stops,
  selectedStopId,
  onChange,
  className = '',
}) => {
  if (stops.length === 0) return null;

  if (stops.length === 1) {
    return (
      <div
        className={[
          'inline-flex items-center gap-2 text-sm text-neutral-500',
          className,
        ].join(' ')}
      >
        <MapPin className="w-4 h-4 text-neutral-400" />
        <span>{formatStopLabel(stops[0])}</span>
      </div>
    );
  }

  return (
    <div
      className={[
        'flex items-center gap-2 overflow-x-auto',
        className,
      ].join(' ')}
      aria-label="Select trip stop"
    >
      {stops.map((stop) => (
        <button
          key={stop.id}
          type="button"
          onClick={() => onChange(stop.id)}
          className={[
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
            selectedStopId === stop.id
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
          ].join(' ')}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-xs">
            {stop.order}
          </span>
          {stop.name}
        </button>
      ))}
    </div>
  );
};

export default StopSelector;
