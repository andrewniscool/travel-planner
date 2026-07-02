import React from 'react';
import type { TripStop } from '../../types';
import type { StopSelection } from './mapPageDisplay';

interface MapRouteSelectorProps {
  stops: TripStop[];
  selectedStopId: StopSelection;
  onSelectStop: (stopId: StopSelection) => void;
}

const MapRouteSelector: React.FC<MapRouteSelectorProps> = ({
  stops,
  selectedStopId,
  onSelectStop,
}) => (
  <div className="mb-4 shrink-0 bg-white rounded-2xl shadow-card border border-neutral-100 p-4">
    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
      Trip Route
    </p>
    <div className="flex flex-wrap items-center gap-2 text-lg font-semibold text-neutral-900">
      {stops.map((stop, index) => (
        <React.Fragment key={stop.id}>
          <span>{stop.name}</span>
          {index < stops.length - 1 && <span className="text-neutral-300">→</span>}
        </React.Fragment>
      ))}
    </div>
    <div className="flex flex-wrap gap-2 mt-4">
      <button
        type="button"
        onClick={() => onSelectStop('all')}
        className={[
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          selectedStopId === 'all'
            ? 'bg-primary-600 text-white'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
        ].join(' ')}
      >
        All Stops
      </button>
      {stops.map((stop) => (
        <button
          key={stop.id}
          type="button"
          onClick={() => onSelectStop(stop.id)}
          className={[
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
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
  </div>
);

export default MapRouteSelector;
