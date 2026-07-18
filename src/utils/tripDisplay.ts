import { getTripRouteLabel, isMultiStopTrip } from '../data/trips';
import type { Trip } from '../types';

export const formatDateRange = (start: string, end: string) => {
  if (!start && !end) return 'Dates TBD';
  const format = (date: string, includeYear = true) =>
    new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(includeYear ? { year: 'numeric' } : {}),
    });
  if (!start) return `Until ${format(end)}`;
  if (!end) return `From ${format(start)}`;
  return `${format(start, false)} – ${format(end)}`;
};

export const getTripLocationLabel = (trip: Trip) => {
  if (isMultiStopTrip(trip)) return getTripRouteLabel(trip);
  const [stop] = trip.stops;
  return stop?.country
    ? `${stop.name}, ${stop.country}`
    : stop?.name || [trip.destination, trip.country].filter(Boolean).join(', ');
};

export const formatLongDate = (dateStr: string): string => {
  if (!dateStr) return 'Date TBD';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDayDate = (dateStr: string): string => {
  if (!dateStr) return 'Date TBD';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const getDaysUntil = (startDate: string): number | null => {
  if (!startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${startDate}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
};

export const selectNextTrip = (trips: Trip[]): Trip | null => {
  const futureTrips = trips
    .filter(
      (trip) =>
        trip.status !== 'past' &&
        getDaysUntil(trip.startDate) !== null &&
        getDaysUntil(trip.startDate)! >= 0,
    )
    .sort(
      (a, b) =>
        new Date(`${a.startDate}T00:00:00`).getTime() -
        new Date(`${b.startDate}T00:00:00`).getTime(),
    );
  if (futureTrips[0]) return futureTrips[0];
  const planningTrips = trips
    .filter((trip) => trip.status === 'planning')
    .sort((a, b) => b.planningProgress - a.planningProgress);
  return planningTrips[0] ?? trips.find((trip) => trip.status !== 'past') ?? null;
};
