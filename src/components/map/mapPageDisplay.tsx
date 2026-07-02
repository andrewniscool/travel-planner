import React from 'react';
import {
  Building2,
  CalendarDays,
  Car,
  MapPin,
  Plane,
  Train,
  UtensilsCrossed,
} from 'lucide-react';
import type { PlaceCategory, TripStop } from '../../types';

export type CategoryFilter = 'Hotels' | 'Food' | 'Activities' | 'Itinerary' | 'Transport';
export type StopSelection = 'all' | string;
export type MapPinKind = 'hotel' | 'food' | 'activity' | 'itinerary' | 'transport';

export interface MapPinData {
  id: string;
  kind: MapPinKind;
  label: string;
  stopId: string;
  left: string;
  top: string;
}

export const categoryIcons: Record<CategoryFilter, React.ReactNode> = {
  Hotels: <Building2 className="w-4 h-4" />,
  Food: <UtensilsCrossed className="w-4 h-4" />,
  Activities: <MapPin className="w-4 h-4" />,
  Itinerary: <CalendarDays className="w-4 h-4" />,
  Transport: <Plane className="w-4 h-4" />,
};

export const placeCategoryMap: Record<PlaceCategory, CategoryFilter> = {
  Restaurants: 'Food',
  Cafes: 'Food',
  Museums: 'Activities',
  Outdoor: 'Activities',
  Nightlife: 'Activities',
  Shopping: 'Activities',
  Tours: 'Activities',
  Landmarks: 'Activities',
  'Hidden Gems': 'Activities',
};

const stopPositions = [
  { left: '18%', top: '58%' },
  { left: '38%', top: '38%' },
  { left: '60%', top: '56%' },
  { left: '80%', top: '32%' },
  { left: '72%', top: '72%' },
  { left: '28%', top: '26%' },
];

export const detailOffsets = [
  { x: -7, y: -12 },
  { x: 9, y: -10 },
  { x: -10, y: 11 },
  { x: 11, y: 12 },
  { x: 0, y: 17 },
];

export const singleStopPositions = [
  { left: '48%', top: '44%' },
  { left: '30%', top: '36%' },
  { left: '66%', top: '35%' },
  { left: '28%', top: '64%' },
  { left: '62%', top: '65%' },
  { left: '80%', top: '18%' },
];

export const getStopPosition = (index: number) =>
  stopPositions[index % stopPositions.length];

export const formatStopDates = (stop: TripStop) => {
  const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const start = new Date(`${stop.startDate}T00:00:00`).toLocaleDateString('en-US', dateOptions);
  const end = new Date(`${stop.endDate}T00:00:00`).toLocaleDateString('en-US', dateOptions);
  return `${start} - ${end}`;
};

export const getPinClasses = (kind: MapPinKind) => {
  switch (kind) {
    case 'hotel':
      return 'bg-primary-600';
    case 'food':
      return 'bg-accent-600';
    case 'activity':
      return 'bg-success-500';
    case 'itinerary':
      return 'bg-warning-500';
    case 'transport':
      return 'bg-error-500';
    default:
      return 'bg-neutral-600';
  }
};

export const getPinIcon = (kind: MapPinKind) => {
  switch (kind) {
    case 'hotel':
      return <Building2 className="w-4 h-4" />;
    case 'food':
      return <UtensilsCrossed className="w-4 h-4" />;
    case 'transport':
      return <Plane className="w-4 h-4" />;
    case 'itinerary':
      return <CalendarDays className="w-4 h-4" />;
    default:
      return <MapPin className="w-4 h-4" />;
  }
};

export const getTransportIcon = (mode?: string) =>
  mode === 'train' ? <Train className="w-4 h-4" /> : <Car className="w-4 h-4" />;
