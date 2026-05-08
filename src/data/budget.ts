import { BudgetCategory } from '../types';

export interface TripBudget {
  tripId: string;
  categories: BudgetCategory[];
}

export const budgetCategories: TripBudget[] = [
  {
    tripId: 'trip-1',
    categories: [
      { name: 'Flights', allocated: 1800, spent: 1760, icon: '✈️' },
      { name: 'Hotel', allocated: 1500, spent: 0, icon: '🏨' },
      { name: 'Food', allocated: 900, spent: 120, icon: '🍜' },
      { name: 'Activities', allocated: 600, spent: 85, icon: '🗼' },
      { name: 'Transportation', allocated: 450, spent: 70, icon: '🚅' },
      { name: 'Miscellaneous', allocated: 250, spent: 35, icon: '🛍️' },
    ],
  },
  {
    tripId: 'trip-2',
    categories: [
      { name: 'Flights', allocated: 2200, spent: 2200, icon: '✈️' },
      { name: 'Hotel', allocated: 2800, spent: 2800, icon: '🏨' },
      { name: 'Food', allocated: 1000, spent: 345, icon: '🥐' },
      { name: 'Activities', allocated: 500, spent: 83, icon: '🎨' },
      { name: 'Transportation', allocated: 300, spent: 55, icon: '🚇' },
      { name: 'Miscellaneous', allocated: 200, spent: 40, icon: '🛍️' },
    ],
  },
  {
    tripId: 'trip-3',
    categories: [
      { name: 'Flights', allocated: 1000, spent: 980, icon: '✈️' },
      { name: 'Hotel', allocated: 1200, spent: 600, icon: '🏨' },
      { name: 'Food', allocated: 700, spent: 0, icon: '🍛' },
      { name: 'Activities', allocated: 800, spent: 0, icon: '🏄' },
      { name: 'Transportation', allocated: 300, spent: 25, icon: '🛵' },
      { name: 'Miscellaneous', allocated: 200, spent: 0, icon: '🛍️' },
    ],
  },
  {
    tripId: 'trip-4',
    categories: [
      { name: 'Flights', allocated: 900, spent: 900, icon: '✈️' },
      { name: 'Hotel', allocated: 1200, spent: 1200, icon: '🏨' },
      { name: 'Food', allocated: 700, spent: 700, icon: '🍕' },
      { name: 'Activities', allocated: 400, spent: 400, icon: '🎭' },
      { name: 'Transportation', allocated: 200, spent: 200, icon: '🚕' },
      { name: 'Miscellaneous', allocated: 100, spent: 100, icon: '🛍️' },
    ],
  },
  {
    tripId: 'trip-5',
    categories: [
      { name: 'Flights', allocated: 900, spent: 0, icon: '✈️' },
      { name: 'Hotel', allocated: 1000, spent: 0, icon: '🏨' },
      { name: 'Food', allocated: 600, spent: 0, icon: '🥑' },
      { name: 'Activities', allocated: 800, spent: 0, icon: '🧗' },
      { name: 'Transportation', allocated: 300, spent: 0, icon: '🚐' },
      { name: 'Miscellaneous', allocated: 200, spent: 0, icon: '🛍️' },
    ],
  },
];

export const getBudgetByTripId = (tripId: string): TripBudget | undefined =>
  budgetCategories.find(b => b.tripId === tripId);
