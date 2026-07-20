import type { Hotel, ItineraryDay, ItineraryItem, TransportSegment } from '../types';
import { isMajorTransport } from './planTransport';

export type PlanTimelineEntry =
  | { kind: 'transport'; id: string; date: string; time: string; segment: TransportSegment; prominent: boolean }
  | { kind: 'travel-arrival'; id: string; date: string; time: string; segment: TransportSegment }
  | { kind: 'stay'; id: string; date: string; time: ''; hotel: Hotel }
  | { kind: 'itinerary'; id: string; date: string; time: string; item: ItineraryItem };

const splitLocalDateTime = (value?: string) => {
  if (!value) return { date: '', time: '' };
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? { date: match[1], time: match[2] } : { date: '', time: '' };
};

export const formatLocalDateTime = (value?: string) => {
  const { date, time } = splitLocalDateTime(value);
  if (!date) return '';
  const label = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (!time) return label;
  const [hour, minute] = time.split(':').map(Number);
  const timeLabel = new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${label}, ${timeLabel}`;
};

export const getStayNightCount = (hotel: Pick<Hotel, 'checkIn' | 'checkOut'>) => {
  if (!hotel.checkIn || !hotel.checkOut) return undefined;
  const start = Date.parse(`${hotel.checkIn}T00:00:00Z`);
  const end = Date.parse(`${hotel.checkOut}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;
  return Math.round((end - start) / 86_400_000);
};

export const getStayAnchorDate = (hotel: Hotel, stopStartDate?: string) =>
  hotel.checkIn || stopStartDate || '';

export const buildPlanTimelineEntries = (
  days: ItineraryDay[],
  transport: TransportSegment[],
  hotels: Hotel[],
  getStopStartDate: (stopId?: string) => string | undefined,
) => {
  const entries: PlanTimelineEntry[] = [];

  days.forEach((day) => {
    [...day.morning, ...day.afternoon, ...day.evening].forEach((item) => {
      entries.push({ kind: 'itinerary', id: `item-${item.id}`, date: day.date, time: item.time || '', item });
    });
  });

  transport.forEach((segment) => {
    const departure = splitLocalDateTime(segment.departureDateTime);
    const arrival = splitLocalDateTime(segment.arrivalDateTime);
    const date = departure.date || arrival.date;
    if (!date) return;
    entries.push({
      kind: 'transport',
      id: `transport-${segment.id}`,
      date,
      time: departure.time || arrival.time,
      segment,
      prominent: isMajorTransport(segment),
    });
    if (isMajorTransport(segment) && arrival.date && arrival.date !== date) {
      entries.push({ kind: 'travel-arrival', id: `arrival-${segment.id}`, date: arrival.date, time: arrival.time, segment });
    }
  });

  hotels.forEach((hotel) => {
    const date = getStayAnchorDate(hotel, getStopStartDate(hotel.stopId));
    if (date) entries.push({ kind: 'stay', id: `stay-${hotel.id}`, date, time: '', hotel });
  });

  return entries.sort((a, b) => {
    const dateOrder = a.date.localeCompare(b.date);
    if (dateOrder) return dateOrder;
    if (a.kind === 'stay' && b.kind !== 'stay') return -1;
    if (b.kind === 'stay' && a.kind !== 'stay') return 1;
    const aTime = a.time || '99:99';
    const bTime = b.time || '99:99';
    return aTime.localeCompare(bTime) || a.id.localeCompare(b.id);
  });
};

export const groupPlanTimelineByDate = (entries: PlanTimelineEntry[]) => {
  const grouped = new Map<string, PlanTimelineEntry[]>();
  entries.forEach((entry) => grouped.set(entry.date, [...(grouped.get(entry.date) || []), entry]));
  return grouped;
};
