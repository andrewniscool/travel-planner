import React from 'react';
import { Bookmark, GitCompare, Check, ExternalLink, Clock, Plane, Luggage } from 'lucide-react';
import type { Flight } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface FlightCardProps {
  flight: Flight;
  isSelected: boolean;
  onSelect: () => void;
  onSave: () => void;
  onCompare: () => void;
}

const airlineColors: Record<string, string> = {
  JL: 'bg-red-500',
  NH: 'bg-blue-600',
  UA: 'bg-blue-800',
  DL: 'bg-indigo-600',
  SQ: 'bg-yellow-500',
  AA: 'bg-red-700',
  AF: 'bg-blue-500',
  B6: 'bg-sky-500',
  LH: 'bg-yellow-600',
  BA: 'bg-red-600',
  WN: 'bg-orange-500',
  NK: 'bg-yellow-400',
  GA: 'bg-emerald-600',
  CX: 'bg-green-600',
  QR: 'bg-purple-700',
  MH: 'bg-blue-400',
  BR: 'bg-green-500',
  AV: 'bg-red-500',
  CM: 'bg-blue-700',
};

const FlightCard: React.FC<FlightCardProps> = ({
  flight,
  isSelected,
  onSelect,
  onSave,
  onCompare,
}) => {
  const colorClass = airlineColors[flight.airlineLogo] || 'bg-neutral-500';

  const stopsLabel =
    flight.stops === 0
      ? 'Nonstop'
      : flight.stops === 1
        ? '1 Stop'
        : `${flight.stops} Stops`;

  return (
    <Card
      hover={false}
      className={[
        'transition-all duration-200',
        isSelected
          ? 'border-primary-500 bg-primary-50/30'
          : 'border-neutral-100 bg-white',
      ].join(' ')}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4">
        {/* Left section: Airline + Route */}
        <div className="flex items-center gap-4 lg:w-[340px] shrink-0">
          {/* Airline logo placeholder */}
          <div
            className={[
              'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
              colorClass,
            ].join(' ')}
          >
            {flight.airline.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900 text-sm truncate">
              {flight.airline}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              {/* Departure */}
              <div className="text-center">
                <p className="text-base font-bold text-neutral-900">
                  {flight.departureTime}
                </p>
                <p className="text-xs text-neutral-500 font-medium">
                  {flight.departureAirportCode}
                </p>
              </div>

              {/* Duration line */}
              <div className="flex-1 flex flex-col items-center gap-0.5 px-2">
                <span className="text-[10px] text-neutral-400 font-medium">
                  {flight.duration}
                </span>
                <div className="w-full flex items-center gap-1">
                  <div className="h-px flex-1 bg-neutral-200" />
                  <Plane className="w-3 h-3 text-neutral-400 -rotate-0" />
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>
                <span className="text-[10px] text-neutral-400">
                  {stopsLabel}
                </span>
              </div>

              {/* Arrival */}
              <div className="text-center">
                <p className="text-base font-bold text-neutral-900">
                  {flight.arrivalTime}
                </p>
                <p className="text-xs text-neutral-500 font-medium">
                  {flight.arrivalAirportCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle section: Details */}
        <div className="flex-1 flex flex-col gap-1.5 lg:border-l lg:border-neutral-100 lg:pl-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-neutral-600">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{flight.duration}</span>
            </div>
            <Badge variant={flight.stops === 0 ? 'success' : 'default'}>
              {stopsLabel}
            </Badge>
            {flight.stopCity && (
              <span className="text-xs text-neutral-500">
                via {flight.stopCity}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Luggage className="w-3.5 h-3.5 text-neutral-400" />
            <span>{flight.baggage}</span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            via {flight.bookingSource}
          </p>
        </div>

        {/* Right section: Price + Actions */}
        <div className="flex flex-col items-end gap-2 lg:border-l lg:border-neutral-100 lg:pl-4 shrink-0">
          <p className="text-2xl font-bold text-neutral-900">
            ${flight.price.toLocaleString()}
          </p>
          <p className="text-xs text-neutral-400">per person</p>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap justify-end">
            <Button variant="ghost" size="sm" onClick={onSave}>
              <Bookmark className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onCompare}>
              <GitCompare className="w-4 h-4" />
            </Button>
            <Button
              variant={isSelected ? 'primary' : 'outline'}
              size="sm"
              onClick={onSelect}
            >
              <Check className="w-4 h-4 mr-1" />
              Select
            </Button>
            {flight.bookingUrl && (
              <a href={flight.bookingUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Book Flight
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FlightCard;
