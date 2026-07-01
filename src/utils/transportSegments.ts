import type { LocationRef, TransportSegment } from '../types';

export type TravelFilter =
  | 'all'
  | 'flight'
  | 'train'
  | 'transfer'
  | 'local'
  | 'missing';

export const splitDateTime = (dateTime?: string) => {
  if (!dateTime) return { date: '', time: '' };
  const [date, time = ''] = dateTime.split('T');
  return { date, time: time.slice(0, 5) };
};

export const buildDateTime = (date: string, time: string) => {
  if (!date) return undefined;
  return `${date}T${time || '00:00'}:00`;
};

export const formatDateTime = (dateTime?: string) => {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const calculateDuration = (departure?: string, arrival?: string) => {
  if (!departure || !arrival) return undefined;
  const start = new Date(departure).getTime();
  const end = new Date(arrival).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return undefined;
  }

  const minutes = Math.round((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return [hours ? `${hours}h` : '', mins ? `${mins}m` : '']
    .filter(Boolean)
    .join(' ');
};

const getSegmentSortValue = (segment: TransportSegment) => {
  const dateTime = segment.departureDateTime || segment.arrivalDateTime;
  if (!dateTime) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(dateTime).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

export const sortSegmentsByTime = (segments: TransportSegment[]) =>
  [...segments].sort((a, b) => getSegmentSortValue(a) - getSegmentSortValue(b));

export const getLocationName = (
  location?: LocationRef | null,
  fallback = '',
) => location?.name || fallback;

export const isTransferSegment = (segment: TransportSegment) =>
  segment.mode !== 'flight' &&
  (segment.role === 'arrival' ||
    segment.role === 'departure' ||
    segment.role === 'between-stops' ||
    Boolean(segment.fromStopId && segment.toStopId));

export const getMissingDetails = (segment: TransportSegment) => {
  const missing: string[] = [];

  if (!getLocationName(segment.fromLocation, segment.departureLocation)) {
    missing.push('From');
  }
  if (!getLocationName(segment.toLocation, segment.arrivalLocation)) {
    missing.push('To');
  }
  if (!segment.departureDateTime) missing.push('Departure');
  if (!segment.arrivalDateTime) missing.push('Arrival');
  if (!segment.provider && segment.mode === 'flight') missing.push('Airline');
  if (!segment.confirmationCode && (segment.mode === 'flight' || segment.bookingUrl)) {
    missing.push('Confirmation');
  }
  if (!segment.bookingUrl) missing.push('Booking link');

  return missing;
};

export const matchesTravelFilter = (
  segment: TransportSegment,
  filter: TravelFilter,
) => {
  if (filter === 'all') return true;
  if (filter === 'missing') return getMissingDetails(segment).length > 0;
  if (filter === 'transfer') return isTransferSegment(segment);
  if (filter === 'local') {
    return segment.mode !== 'flight' && segment.role === 'local';
  }
  if (filter === 'train') {
    return (
      segment.mode === 'train' ||
      segment.mode === 'bus' ||
      segment.mode === 'ferry'
    );
  }
  return segment.mode === filter;
};

export const formatCurrency = (value?: number, currency = 'USD') =>
  typeof value === 'number' ? `${currency} ${value.toLocaleString()}` : null;

export const makeManualLocationRef = (name: string): LocationRef | null => {
  const trimmedName = name.trim();
  if (!trimmedName) return null;
  return {
    id: `manual-${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: trimmedName,
    source: 'manual',
  };
};
