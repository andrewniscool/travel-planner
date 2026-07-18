import type { ItineraryDay, ItineraryItem } from '../types';

export const allItineraryItems = (day: ItineraryDay): ItineraryItem[] => [
  ...day.morning,
  ...day.afternoon,
  ...day.evening,
];
