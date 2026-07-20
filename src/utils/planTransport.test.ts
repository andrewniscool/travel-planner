import { describe, expect, it } from 'vitest';
import { getMissingStopConnections, isMajorTransport } from './planTransport';
import type { TransportSegment, TripStop } from '../types';

const segment = (patch: Partial<TransportSegment>): TransportSegment => ({
  id: 'segment', tripId: 'trip', mode: 'car', departureLocation: 'A', arrivalLocation: 'B', ...patch,
});
const stops: TripStop[] = [
  { id: 'a', tripId: 'trip', name: 'Paris', startDate: '', endDate: '', order: 1 },
  { id: 'b', tripId: 'trip', name: 'Amsterdam', startDate: '', endDate: '', order: 2 },
  { id: 'c', tripId: 'trip', name: 'Berlin', startDate: '', endDate: '', order: 3 },
];

describe('Plan transportation placement', () => {
  it('classifies intercity and between-stop travel as major', () => {
    expect(isMajorTransport(segment({ mode: 'flight' }))).toBe(true);
    expect(isMajorTransport(segment({ fromStopId: 'a', toStopId: 'b' }))).toBe(true);
    expect(isMajorTransport(segment({ mode: 'car', role: 'local', fromStopId: 'a', toStopId: 'a' }))).toBe(false);
    expect(isMajorTransport(segment({ mode: 'train', role: 'local' }))).toBe(false);
    expect(isMajorTransport(segment({ mode: 'bus' }))).toBe(false);
  });

  it('reports only missing adjacent stop connections', () => {
    const result = getMissingStopConnections([segment({ fromStopId: 'a', toStopId: 'b' })], stops);
    expect(result.map(({ fromStop, toStop }) => `${fromStop.id}-${toStop.id}`)).toEqual(['b-c']);
  });
});
