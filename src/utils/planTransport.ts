import type { TransportSegment, TripStop } from '../types';

const INTERCITY_MODES = new Set<TransportSegment['mode']>(['flight', 'train', 'ferry']);

export const isMajorTransport = (segment: TransportSegment) => {
  if (segment.role === 'local') return false;
  return Boolean(segment.isPrimary) ||
    Boolean(segment.fromStopId && segment.toStopId && segment.fromStopId !== segment.toStopId) ||
    segment.role === 'arrival' ||
    segment.role === 'departure' ||
    segment.role === 'between-stops' ||
    INTERCITY_MODES.has(segment.mode);
};

export const getInterStopSegments = (
  segments: TransportSegment[],
  fromStopId: string,
  toStopId: string,
) => segments.filter((segment) => segment.fromStopId === fromStopId && segment.toStopId === toStopId);

export const getMissingStopConnections = (segments: TransportSegment[], stops: TripStop[]) =>
  stops.slice(0, -1).flatMap((fromStop, index) => {
    const toStop = stops[index + 1];
    return getInterStopSegments(segments, fromStop.id, toStop.id).length > 0
      ? []
      : [{ fromStop, toStop }];
  });

export const getInboundSegments = (segments: TransportSegment[], firstStop?: TripStop) => {
  if (!firstStop) return [];
  return segments.filter((segment) =>
    segment.role === 'arrival' &&
    (!segment.toStopId || segment.toStopId === firstStop.id) &&
    segment.fromStopId !== firstStop.id,
  );
};

export const getOutboundSegments = (segments: TransportSegment[], lastStop?: TripStop) => {
  if (!lastStop) return [];
  return segments.filter((segment) =>
    segment.role === 'departure' &&
    (!segment.fromStopId || segment.fromStopId === lastStop.id) &&
    segment.toStopId !== lastStop.id,
  );
};

export const getUnplacedTransport = (segments: TransportSegment[], placedIds: Set<string>) =>
  segments.filter((segment) => !placedIds.has(segment.id));

export const getTransportTimestamp = (segment: TransportSegment) => {
  const value = segment.departureDateTime || segment.arrivalDateTime;
  if (!value) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
};

export const sortPlanTransport = (segments: TransportSegment[]) =>
  [...segments].sort((a, b) => getTransportTimestamp(a) - getTransportTimestamp(b));
