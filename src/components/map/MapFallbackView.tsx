import React from 'react';
import { MapPin } from 'lucide-react';
import type { TripStop } from '../../types';
import {
  formatStopDates,
  getPinClasses,
  getPinIcon,
  getStopPosition,
  type MapPinData,
  type StopSelection,
} from './mapPageDisplay';

const MapPinMarker: React.FC<MapPinData> = ({ kind, left, top, label }) => (
  <div className="absolute group" style={{ left, top }}>
    <div
      className={[
        'flex items-center justify-center w-9 h-9 rounded-full shadow-lg text-white',
        'transition-transform duration-200 group-hover:scale-110',
        getPinClasses(kind),
      ].join(' ')}
    >
      {getPinIcon(kind)}
    </div>
    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-neutral-700 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm">
      {label}
    </span>
  </div>
);

interface StopMarkerProps {
  stop: TripStop;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

const StopMarker: React.FC<StopMarkerProps> = ({
  stop,
  index,
  isSelected,
  onSelect,
}) => {
  const position = getStopPosition(index);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="absolute group text-left"
      style={{ left: position.left, top: position.top }}
    >
      <div
        className={[
          'flex items-center justify-center w-14 h-14 rounded-full shadow-lg border-2 transition-transform duration-200 group-hover:scale-105',
          isSelected
            ? 'bg-primary-600 border-white text-white'
            : 'bg-white border-primary-200 text-primary-600',
        ].join(' ')}
      >
        <span className="text-base font-bold">{stop.order}</span>
      </div>
      <div className="absolute left-1/2 top-16 -translate-x-1/2 min-w-max rounded-xl bg-white/95 px-3 py-1.5 shadow-sm border border-neutral-100">
        <p className="text-xs font-semibold text-neutral-800">{stop.name}</p>
        <p className="text-[11px] text-neutral-400">{formatStopDates(stop)}</p>
      </div>
    </button>
  );
};

interface MapFallbackViewProps {
  mapTitle: string;
  isMultiStop: boolean;
  routeLinePoints: string;
  orderedStops: TripStop[];
  primaryStop: TripStop;
  effectiveSelection: StopSelection;
  visiblePins: MapPinData[];
  onSelectStop: (stopId: StopSelection) => void;
}

const MapFallbackView: React.FC<MapFallbackViewProps> = ({
  mapTitle,
  isMultiStop,
  routeLinePoints,
  orderedStops,
  primaryStop,
  effectiveSelection,
  visiblePins,
  onSelectStop,
}) => (
  <div className="relative h-[420px] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100 lg:h-full">
    <div className="absolute top-4 left-4 right-4 z-10 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
      <MapPin className="w-4 h-4 text-primary-500" />
      <span className="text-sm text-neutral-600">{mapTitle}</span>
    </div>

    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 bottom-0 left-[20%] w-px bg-primary-400" />
      <div className="absolute top-0 bottom-0 left-[40%] w-px bg-primary-400" />
      <div className="absolute top-0 bottom-0 left-[60%] w-px bg-primary-400" />
      <div className="absolute top-0 bottom-0 left-[80%] w-px bg-primary-400" />
      <div className="absolute left-0 right-0 top-[25%] h-px bg-primary-400" />
      <div className="absolute left-0 right-0 top-[50%] h-px bg-primary-400" />
      <div className="absolute left-0 right-0 top-[75%] h-px bg-primary-400" />
    </div>

    {isMultiStop && (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          points={routeLinePoints}
          fill="none"
          stroke="rgba(37, 99, 235, 0.35)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}

    {isMultiStop ? (
      orderedStops.map((stop, index) => (
        <StopMarker
          key={stop.id}
          stop={stop}
          index={index}
          isSelected={effectiveSelection === 'all' || effectiveSelection === stop.id}
          onSelect={() => onSelectStop(stop.id)}
        />
      ))
    ) : (
      <StopMarker
        stop={primaryStop}
        index={0}
        isSelected
        onSelect={() => onSelectStop(primaryStop.id)}
      />
    )}

    {visiblePins.map((pin) => (
      <MapPinMarker key={`${pin.kind}-${pin.id}`} {...pin} />
    ))}

    {visiblePins.length === 0 && (
      <div className="absolute left-1/2 bottom-6 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-sm border border-neutral-100 text-center">
        <p className="text-sm font-medium text-neutral-700">No pins in this view</p>
        <p className="text-xs text-neutral-400 mt-0.5">
          Add hotels, places, itinerary items, or travel details for this stop.
        </p>
      </div>
    )}
  </div>
);

export default MapFallbackView;
