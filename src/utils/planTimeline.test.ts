import { describe, expect, it } from 'vitest';
import { buildPlanTimelineEntries, getStayNightCount } from './planTimeline';
import type { Hotel, ItineraryDay, TransportSegment } from '../types';

const day: ItineraryDay = {
  dayNumber: 1,
  date: '2026-08-10',
  morning: [{ id: 'museum', time: '10:00', name: 'Museum', type: 'activity', location: 'Center', estimatedCost: 20, notes: '' }],
  afternoon: [],
  evening: [],
};

const stay: Hotel = {
  id: 'stay', tripId: 'trip', stopId: 'paris', name: 'Hotel', image: '', rating: 0,
  reviewCount: 0, pricePerNight: 100, totalCost: 300, checkIn: '2026-08-10',
  checkOut: '2026-08-13', amenities: [], neighborhood: 'Center', distanceToCenter: '', description: '',
};

const segment: TransportSegment = {
  id: 'train', tripId: 'trip', mode: 'train', role: 'between-stops',
  departureLocation: 'Paris', arrivalLocation: 'Rome',
  departureDateTime: '2026-08-10T08:00', arrivalDateTime: '2026-08-11T07:00',
};

describe('Plan timeline', () => {
  it('orders a stay anchor before timed travel and activities', () => {
    const entries = buildPlanTimelineEntries([day], [segment], [stay], () => undefined);
    expect(entries.map((entry) => entry.id)).toEqual([
      'stay-stay', 'transport-train', 'item-museum', 'arrival-train',
    ]);
  });

  it('computes date-only stay durations without local timezone shifts', () => {
    expect(getStayNightCount(stay)).toBe(3);
    expect(getStayNightCount({ checkIn: '2026-08-13', checkOut: '2026-08-10' })).toBeUndefined();
  });
});
