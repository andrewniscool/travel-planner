import { describe, expect, it } from 'vitest';
import { getNextTripAction } from './nextTripAction';
import type { TripData } from '../hooks/useTripData';
import type { Trip } from '../types';

const trip: Trip = {
  id: 'trip-1', title: 'Lisbon', destination: 'Lisbon', country: 'Portugal',
  startDate: '2026-09-01', endDate: '2026-09-05', travelers: 2, budget: 2000,
  vibe: 'Cultural', status: 'planning', notes: '', image: '', planningProgress: 40,
  stops: [{ id: 'stop-1', tripId: 'trip-1', name: 'Lisbon', startDate: '2026-09-01', endDate: '2026-09-05', order: 1 }],
  transportSegments: [],
};

const makeData = (overrides: Partial<TripData> = {}): TripData => ({
  trip, orderedStops: trip.stops, hotels: [], itinerary: [], checklist: [], totalAllocated: 2000,
  ...overrides,
} as TripData);

describe('getNextTripAction', () => {
  it('prioritizes missing transportation', () => {
    expect(getNextTripAction(makeData()).route).toBe('plan?add=transport');
  });

  it('moves to lodging after transportation exists', () => {
    const withTransport = { ...trip, transportSegments: [{ id: 'segment-1', tripId: trip.id, mode: 'flight' as const, departureLocation: 'JFK', arrivalLocation: 'LIS' }] };
    expect(getNextTripAction(makeData({ trip: withTransport })).route).toBe('plan?add=stay');
  });

  it('moves to places when transport and lodging are present', () => {
    const withTransport = { ...trip, transportSegments: [{ id: 'segment-1', tripId: trip.id, mode: 'flight' as const, departureLocation: 'JFK', arrivalLocation: 'LIS' }] };
    const hotels = [{ id: 'hotel-1', tripId: trip.id, stopId: 'stop-1', name: 'Stay', image: '', rating: 4, reviewCount: 1, pricePerNight: 100, totalCost: 400, amenities: [], neighborhood: '', distanceToCenter: '', description: '', isSelected: true }];
    expect(getNextTripAction(makeData({ trip: withTransport, hotels })).route).toBe('plan?add=place');
  });
});
